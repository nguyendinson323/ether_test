class TokenDashboard {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.isConnected = false;
        this.pendingTransactions = new Set();

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.connectWallet();
        this.startTransactionMonitoring();
    }

    setupEventListeners() {
        document.getElementById('refreshBalance').addEventListener('click', () => {
            this.updateBalance();
        });

        document.getElementById('transferForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendTransaction();
        });

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.connectWallet();
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                this.showNotification('Please install MetaMask to use this application', 'error');
                return;
            }

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();
            this.isConnected = true;

            this.updateConnectionStatus();
            await this.updateBalance();

            this.showNotification('Wallet connected successfully!', 'success');
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showNotification('Failed to connect wallet', 'error');
        }
    }

    disconnect() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.isConnected = false;
        this.updateConnectionStatus();
        this.updateBalanceDisplay('0.00');
    }

    updateConnectionStatus() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        if (this.isConnected) {
            statusDot.classList.add('connected');
            statusText.textContent = `Connected: ${this.userAddress?.slice(0, 6)}...${this.userAddress?.slice(-4)}`;
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Not Connected';
        }
    }

    async updateBalance() {
        if (!this.isConnected || !this.provider) {
            return;
        }

        try {
            const refreshBtn = document.getElementById('refreshBalance');
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;

            const balance = await this.provider.getBalance(this.userAddress);
            const balanceInEth = ethers.utils.formatEther(balance);

            this.updateBalanceDisplay(balanceInEth);

            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        } catch (error) {
            console.error('Error fetching balance:', error);
            this.showNotification('Failed to fetch balance', 'error');

            const refreshBtn = document.getElementById('refreshBalance');
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }

    updateBalanceDisplay(balance) {
        const balanceElement = document.getElementById('tokenBalance');
        const numericBalance = parseFloat(balance);
        balanceElement.textContent = numericBalance.toFixed(4);

        // Add animation effect
        balanceElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            balanceElement.style.transform = 'scale(1)';
        }, 200);
    }

    async sendTransaction() {
        if (!this.isConnected) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }

        const recipientAddress = document.getElementById('recipientAddress').value;
        const transferAmount = document.getElementById('transferAmount').value;
        const sendButton = document.getElementById('sendButton');

        if (!recipientAddress || !transferAmount) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            sendButton.disabled = true;
            sendButton.textContent = 'Sending...';

            const tx = await this.signer.sendTransaction({
                to: recipientAddress,
                value: ethers.utils.parseEther(transferAmount)
            });

            this.showNotification(`Transaction sent! Hash: ${tx.hash.slice(0, 10)}...`, 'info');
            this.addTransactionToList(tx.hash, 'pending', transferAmount, recipientAddress);

            // Add to pending transactions for monitoring
            this.pendingTransactions.add(tx.hash);

            // Wait for confirmation in background
            this.waitForTransactionConfirmation(tx.hash);

            // Clear form
            document.getElementById('transferForm').reset();

        } catch (error) {
            console.error('Transaction failed:', error);
            this.showNotification('Transaction failed: ' + error.message, 'error');
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = 'Send Transaction';
        }
    }

    async waitForTransactionConfirmation(txHash) {
        try {
            this.showNotification('Waiting for transaction confirmation...', 'info');

            const receipt = await this.provider.waitForTransaction(txHash, 1);

            if (receipt.status === 1) {
                this.showNotification('Transaction confirmed! Balance updated.', 'success');
                this.updateTransactionStatus(txHash, 'confirmed');

                // Automatically update balance after confirmation
                await this.updateBalance();
            } else {
                this.showNotification('Transaction failed', 'error');
                this.updateTransactionStatus(txHash, 'failed');
            }

            this.pendingTransactions.delete(txHash);
        } catch (error) {
            console.error('Error waiting for transaction:', error);
            this.showNotification('Error monitoring transaction', 'error');
            this.updateTransactionStatus(txHash, 'failed');
            this.pendingTransactions.delete(txHash);
        }
    }

    addTransactionToList(hash, status, amount, recipient) {
        const transactionList = document.getElementById('transactionList');

        // Remove "no transactions" message if it exists
        const noTransactions = transactionList.querySelector('.no-transactions');
        if (noTransactions) {
            noTransactions.remove();
        }

        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.id = `tx-${hash}`;

        transactionItem.innerHTML = `
            <div class="transaction-hash">Hash: ${hash}</div>
            <div>Amount: ${amount} ETH</div>
            <div>To: ${recipient.slice(0, 6)}...${recipient.slice(-4)}</div>
            <div class="transaction-status ${status}">Status: ${status.toUpperCase()}</div>
        `;

        transactionList.insertBefore(transactionItem, transactionList.firstChild);
    }

    updateTransactionStatus(hash, status) {
        const transactionItem = document.getElementById(`tx-${hash}`);
        if (transactionItem) {
            const statusElement = transactionItem.querySelector('.transaction-status');
            statusElement.textContent = `Status: ${status.toUpperCase()}`;
            statusElement.className = `transaction-status ${status}`;
        }
    }

    startTransactionMonitoring() {
        // Monitor pending transactions every 10 seconds
        setInterval(async () => {
            if (this.pendingTransactions.size > 0 && this.isConnected) {
                for (const txHash of this.pendingTransactions) {
                    try {
                        const receipt = await this.provider.getTransactionReceipt(txHash);
                        if (receipt) {
                            if (receipt.status === 1) {
                                this.updateTransactionStatus(txHash, 'confirmed');
                                await this.updateBalance();
                            } else {
                                this.updateTransactionStatus(txHash, 'failed');
                            }
                            this.pendingTransactions.delete(txHash);
                        }
                    } catch (error) {
                        console.error('Error checking transaction status:', error);
                    }
                }
            }
        }, 10000);

        // Also listen for new blocks to check for confirmations
        if (this.provider) {
            this.provider.on('block', async (blockNumber) => {
                if (this.pendingTransactions.size > 0) {
                    for (const txHash of this.pendingTransactions) {
                        try {
                            const receipt = await this.provider.getTransactionReceipt(txHash);
                            if (receipt && receipt.blockNumber) {
                                const confirmations = blockNumber - receipt.blockNumber;
                                if (confirmations >= 1) {
                                    if (receipt.status === 1) {
                                        this.updateTransactionStatus(txHash, 'confirmed');
                                        this.showNotification('Transaction confirmed! Balance updated.', 'success');
                                        await this.updateBalance();
                                    } else {
                                        this.updateTransactionStatus(txHash, 'failed');
                                    }
                                    this.pendingTransactions.delete(txHash);
                                }
                            }
                        } catch (error) {
                            console.error('Error checking transaction in new block:', error);
                        }
                    }
                }
            });
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 300);
        }, 5000);
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TokenDashboard();
});
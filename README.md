# Token Balance Dashboard

A responsive web application that automatically updates token balances after blockchain transactions are confirmed. Built with vanilla JavaScript and ethers.js for Ethereum blockchain interaction.

## Features

- **Automatic Balance Updates**: Token balance refreshes automatically after transaction confirmation
- **Real-time Transaction Monitoring**: Tracks pending transactions and updates status in real-time
- **MetaMask Integration**: Seamless wallet connection and transaction signing
- **Responsive Design**: Works on desktop and mobile devices
- **Transaction History**: View recent transactions with status updates
- **Network Support**: Works with both mainnet and testnet environments

## Requirements

- MetaMask browser extension
- Modern web browser with ES6+ support
- Internet connection for blockchain interaction

## Setup Instructions

1. **Clone or download the project files**
   ```bash
   cd /path/to/project
   ```

2. **Install dependencies** (optional, for development server)
   ```bash
   npm install
   ```

3. **Start the development server** (optional)
   ```bash
   npm start
   ```
   Or simply open `index.html` in your browser

4. **Connect MetaMask**
   - Install MetaMask if not already installed
   - Create or import an Ethereum wallet
   - Switch to your desired network (mainnet/testnet)

## Usage

1. **Connect Wallet**: Click connect when prompted or refresh the page to trigger connection
2. **View Balance**: Your current ETH balance will be displayed automatically
3. **Send Transaction**:
   - Enter recipient address
   - Enter amount to send
   - Click "Send Transaction"
   - Confirm in MetaMask
4. **Monitor Updates**: Watch as your balance updates automatically once the transaction is confirmed

## Technical Implementation

### Key Components

- **TokenDashboard Class**: Main application controller
- **Wallet Connection**: Uses ethers.js Web3Provider for MetaMask integration
- **Transaction Monitoring**: Implements multiple strategies for real-time updates:
  - Block-based monitoring using `provider.on('block')`
  - Polling for transaction receipts every 10 seconds
  - `waitForTransaction()` for immediate confirmation

### Automatic Balance Updates

The application implements several mechanisms to ensure balance updates:

1. **Transaction Confirmation Listener**:
   ```javascript
   await this.provider.waitForTransaction(txHash, 1);
   await this.updateBalance();
   ```

2. **Block-based Monitoring**:
   ```javascript
   this.provider.on('block', async (blockNumber) => {
       // Check pending transactions for confirmations
   });
   ```

3. **Polling System**: Fallback mechanism that checks transaction status every 10 seconds

### Network Compatibility

- **Mainnet**: Production Ethereum network
- **Testnet**: Goerli, Sepolia, and other test networks
- **Local Networks**: Hardhat, Ganache, etc.

## Project Structure

```
├── index.html          # Main HTML file
├── app.js             # Core application logic
├── styles.css         # Styling and responsive design
├── package.json       # Project dependencies
└── README.md          # This file
```

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Troubleshooting

**Wallet not connecting?**
- Ensure MetaMask is installed and unlocked
- Check if the correct network is selected
- Refresh the page and try again

**Balance not updating?**
- Wait for transaction confirmation (1-2 blocks)
- Click "Refresh Balance" manually if needed
- Check network connectivity

**Transaction failing?**
- Ensure sufficient balance for gas fees
- Verify recipient address is valid
- Check if network is experiencing congestion

## Security Notes

- Never share your private keys or seed phrases
- Always verify transaction details before confirming
- Use testnet for development and testing
- Keep MetaMask updated to latest version

## License

MIT License - Feel free to use and modify as needed.
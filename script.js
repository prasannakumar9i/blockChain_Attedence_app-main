// Utility function to display messages to the user
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `mt-4 p-3 text-sm rounded-lg text-center`;
    if (type === 'success') {
        messageBox.classList.add('bg-green-100', 'text-green-700');
    } else if (type === 'error') {
        messageBox.classList.add('bg-red-100', 'text-red-700');
    } else { // info
        messageBox.classList.add('bg-blue-100', 'text-blue-700');
    }
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
}

// --- Blockchain Simulation Classes ---

/**
 * Represents a single block in the blockchain.
 * Each block contains an index, timestamp, data, previous block's hash, and its own hash.
 */
class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data; // e.g., { studentId: 'S123', status: 'present', date: 'YYYY-MM-DD' }
        this.previousHash = previousHash;
        this.hash = this.calculateHash(); // Calculate hash when block is created
    }

    /**
     * Calculates the SHA-256 hash of the block's contents.
     * In a real blockchain, this would involve more robust hashing.
     * @returns {string} The calculated hash.
     */
    calculateHash() {
        // Simple hash for demonstration. A real blockchain uses cryptographic hash functions.
        return btoa(unescape(encodeURIComponent(
            this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)
        ))).substring(0, 64); // Base64 encode and truncate for simplicity
    }
}

/**
 * Represents the blockchain itself.
 * Manages the chain of blocks, including adding new blocks and checking validity.
 */
class Blockchain {
    constructor() {
        this.chain = this.loadChain() || [this.createGenesisBlock()];
    }

    /**
     * Creates the very first block in the chain (genesis block).
     * @returns {Block} The genesis block.
     */
    createGenesisBlock() {
        return new Block(0, Date.now(), { studentId: 'N/A', status: 'Genesis Block', date: 'N/A' }, '0');
    }

    /**
     * Gets the latest block in the chain.
     * @returns {Block} The last block.
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Adds a new block to the chain.
     * @param {Object} data The data for the new block (e.g., attendance status and student ID).
     */
    addBlock(data) {
        const latestBlock = this.getLatestBlock();
        const newBlock = new Block(latestBlock.index + 1, Date.now(), data, latestBlock.hash);
        this.chain.push(newBlock);
        this.saveChain(); // Save the updated chain to local storage
    }

    /**
     * Checks if the entire blockchain is valid.
     * Iterates through each block and verifies its hash and the previous hash link.
     * @returns {boolean} True if the chain is valid, false otherwise.
     */
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check if current block's hash is correctly calculated
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.error(`Block ${i} has been tampered with! Hash mismatch.`);
                return false;
            }

            // Check if current block points to the correct previous hash
            if (currentBlock.previousHash !== previousBlock.hash) {
                console.error(`Block ${i} does not point to the correct previous block's hash.`);
                return false;
            }
        }
        return true;
    }

    /**
     * Loads the blockchain from local storage.
     * Reconstructs Block objects from plain objects stored in localStorage.
     * @returns {Array<Block>|null} The loaded chain or null if not found.
     */
    loadChain() {
        const storedChain = localStorage.getItem('attendanceBlockchain');
        if (storedChain) {
            const parsedChain = JSON.parse(storedChain);
            // Reconstruct Block objects from plain objects
            return parsedChain.map(blockData => {
                const block = new Block(blockData.index, blockData.timestamp, blockData.data, blockData.previousHash);
                block.hash = blockData.hash; // Assign the stored hash
                return block;
            });
        }
        return null;
    }

    /**
     * Saves the current blockchain to local storage.
     */
    saveChain() {
        localStorage.setItem('attendanceBlockchain', JSON.stringify(this.chain));
    }

    /**
     * Clears all attendance data from the blockchain and local storage.
     */
    clearChain() {
        localStorage.removeItem('attendanceBlockchain');
        this.chain = [this.createGenesisBlock()]; // Reset to genesis block
        this.saveChain(); // Save the new genesis block
    }
}

// Initialize the blockchain
const attendanceBlockchain = new Blockchain();

// --- UI Update Functions ---

/**
 * Updates the attendance summary display (total, present, absent, percentage, eligibility).
 */
function updateAttendanceSummary() {
    const chain = attendanceBlockchain.chain.slice(1); // Exclude genesis block
    const totalDays = chain.length;
    let presentDays = 0;

    chain.forEach(block => {
        if (block.data.status === 'present') {
            presentDays++;
        }
    });

    const absentDays = totalDays - presentDays;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    const isEligible = attendancePercentage >= 85;

    document.getElementById('totalDays').textContent = totalDays;
    document.getElementById('presentDays').textContent = presentDays;
    document.getElementById('absentDays').textContent = absentDays;
    document.getElementById('attendancePercentage').textContent = `${attendancePercentage.toFixed(2)}%`;

    const eligibilityStatusElement = document.getElementById('eligibilityStatus');
    if (totalDays === 0) {
        eligibilityStatusElement.textContent = 'N/A';
        eligibilityStatusElement.className = 'font-bold text-gray-800';
    } else if (isEligible) {
        eligibilityStatusElement.textContent = 'Eligible!';
        eligibilityStatusElement.className = 'font-bold text-green-600';
    } else {
        eligibilityStatusElement.textContent = 'Not Eligible';
        eligibilityStatusElement.className = 'font-bold text-red-600';
    }
}

/**
 * Renders the blockchain blocks in the display area.
 */
function renderBlockchain() {
    const blockchainDisplay = document.getElementById('blockchainDisplay');
    const noBlocksMessage = document.getElementById('noBlocksMessage');

    // Add checks for null elements to prevent TypeError
    if (!blockchainDisplay || !noBlocksMessage) {
        console.error("DOM elements not found: blockchainDisplay or noBlocksMessage. Skipping render.");
        return; // Exit if elements are not available
    }

    blockchainDisplay.innerHTML = ''; // Clear previous display
    
    if (attendanceBlockchain.chain.length <= 1) { // Only genesis block or empty
        noBlocksMessage.classList.remove('hidden');
    } else {
        noBlocksMessage.classList.add('hidden');
    }

    // Start from the second block (index 1) to skip the genesis block
    for (let i = 1; i < attendanceBlockchain.chain.length; i++) {
        const block = attendanceBlockchain.chain[i];
        const isValid = block.hash === block.calculateHash(); // Check if block's hash is still valid

        const blockCard = document.createElement('div');
        blockCard.className = `block-card ${isValid ? '' : 'invalid'}`;
        blockCard.innerHTML = `
            <p><strong class="text-blue-700">Block #${block.index}</strong></p>
            <p>Student ID: <span class="font-medium">${block.data.studentId || 'N/A'}</span></p>
            <p>Date: <span class="font-medium">${new Date(block.timestamp).toLocaleDateString()}</span></p>
            <p>Status: <span class="font-bold ${block.data.status === 'present' ? 'text-green-600' : 'text-red-600'}">${block.data.status.toUpperCase()}</span></p>
            <p class="text-sm mt-2 text-gray-600">Previous Hash: <span class="font-mono text-gray-700">${block.previousHash.substring(0, 20)}...</span></p>
            <p class="text-sm text-gray-600">Current Hash: <span class="font-mono ${isValid ? 'text-gray-700' : 'text-red-700'}">${block.hash.substring(0, 20)}...</span></p>
            ${!isValid ? '<p class="text-red-700 font-bold mt-2">🚨 TAMPERED BLOCK DETECTED! Hash Mismatch 🚨</p>' : ''}
        `;
        blockchainDisplay.appendChild(blockCard);
    }

    // Optional: Check chain validity and show a global message if tampered
    if (!attendanceBlockchain.isChainValid()) {
        showMessage('Warning: The blockchain has been tampered with! Data integrity compromised.', 'error');
    }
}

// --- Event Listeners ---

document.getElementById('markPresentBtn').addEventListener('click', () => {
    const studentId = document.getElementById('studentIdInput').value.trim();
    if (!studentId) {
        showMessage('Please enter a Student ID to mark attendance.', 'error');
        return;
    }

    const today = new Date().toISOString().slice(0, 10); //YYYY-MM-DD
    // Check if attendance for today and for this student already exists to prevent duplicate entries
    const existingAttendance = attendanceBlockchain.chain.find(block => 
        block.data.date === today && block.data.studentId === studentId
    );

    if (existingAttendance) {
        showMessage(`Attendance for Student ID ${studentId} on today (${today}) has already been marked as ${existingAttendance.data.status}.`, 'info');
        return;
    }

    attendanceBlockchain.addBlock({ studentId: studentId, status: 'present', date: today });
    updateAttendanceSummary();
    renderBlockchain();
    showMessage(`Attendance marked as Present for Student ID: ${studentId}!`, 'success');
});

document.getElementById('markAbsentBtn').addEventListener('click', () => {
    const studentId = document.getElementById('studentIdInput').value.trim();
    if (!studentId) {
        showMessage('Please enter a Student ID to mark attendance.', 'error');
        return;
    }

    const today = new Date().toISOString().slice(0, 10); //YYYY-MM-DD
    const existingAttendance = attendanceBlockchain.chain.find(block => 
        block.data.date === today && block.data.studentId === studentId
    );

    if (existingAttendance) {
        showMessage(`Attendance for Student ID ${studentId} on today (${today}) has already been marked as ${existingAttendance.data.status}.`, 'info');
        return;
    }

    attendanceBlockchain.addBlock({ studentId: studentId, status: 'absent', date: today });
    updateAttendanceSummary();
    renderBlockchain();
    showMessage(`Attendance marked as Absent for Student ID: ${studentId}!`, 'success');
});

document.getElementById('clearDataBtn').addEventListener('click', () => {
    // Use a custom modal-like confirmation instead of alert/confirm
    const confirmation = confirm('Are you sure you want to clear all attendance data? This action cannot be undone.');
    if (confirmation) {
        attendanceBlockchain.clearChain();
        updateAttendanceSummary();
        renderBlockchain();
        showMessage('All attendance data cleared!', 'success');
    }
});

// --- Initial Load ---
window.onload = function() {
    updateAttendanceSummary();
    renderBlockchain();
};

// Simple custom confirm dialog (replace with a proper modal for production)
function confirm(message) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        justify-content: center; align-items: center; z-index: 1000;
    `;
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background-color: white; padding: 2rem; border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center;
        max-width: 400px; width: 90%;
    `;
    dialog.innerHTML = `
        <p class="text-lg font-semibold mb-4">${message}</p>
        <div class="flex justify-center space-x-4">
            <button id="confirmYes" class="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600">Yes</button>
            <button id="confirmNo" class="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400">No</button>
        </div>
    `;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    return new Promise(resolve => {
        document.getElementById('confirmYes').onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };
        document.getElementById('confirmNo').onclick = () => {
            document.body.removeChild(overlay);
            resolve(false);
        };
    });
}

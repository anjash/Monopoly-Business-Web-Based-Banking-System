let data = {
    players: [],
    properties: [],
    transactions: []
};
let transactionHistory = [JSON.parse(JSON.stringify(data))];
let historyIndex = 0;

function updateTransactionHistory() {
    // Remove any "future" states if a new action is performed after an undo
    if (historyIndex < transactionHistory.length - 1) {
        transactionHistory = transactionHistory.slice(0, historyIndex + 1);
    }
    // Add the new state
    transactionHistory.push(JSON.parse(JSON.stringify(data)));
    historyIndex++;
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        data = JSON.parse(JSON.stringify(transactionHistory[historyIndex]));
        showOutput('Undid last action.');
        viewBalances();
        viewProperties();
        viewTransactions();
        renderPlayerSelectors();
    } else {
        showError('Cannot undo further.');
    }
}

function redo() {
    if (historyIndex < transactionHistory.length - 1) {
        historyIndex++;
        data = JSON.parse(JSON.stringify(transactionHistory[historyIndex]));
        showOutput('Redid action.');
        viewBalances();
        viewProperties();
        viewTransactions();
        renderPlayerSelectors();
    } else {
        showError('Cannot redo further.');
    }
}

function showOutput(message) {
    const logContainer = document.getElementById('updateLog');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry log-output';
    logEntry.innerHTML = `<span class="log-timestamp">${timestamp}</span>${message}`;
    logContainer.prepend(logEntry);
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

function showError(message) {
    const logContainer = document.getElementById('updateLog');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry log-error';
    logEntry.innerHTML = `<span class="log-timestamp">${timestamp}</span>${message}`;
    logContainer.prepend(logEntry);
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

function getPlayer(name) {
    return data.players.find(p => p.name.toLowerCase() === name.toLowerCase());
}

function getProperty(name) {
    return data.properties.find(p => p.name.toLowerCase() === name.toLowerCase());
}

function renderPlayerSelectors() {
    const players = data.players;
    const selectors = {
        'buyPlayerContainer': 'buyPlayer',
        'rentFromContainer': 'rentFrom',
        'rentToContainer': 'rentTo',
        'finePlayerContainer': 'finePlayer',
        'addMoneyPlayerContainer': 'addMoneyPlayer',
        'deductMoneyPlayerContainer': 'deductMoneyPlayer',
        'transferFromContainer': 'transferFrom',
        'transferToContainer': 'transferTo'
    };

    for (const containerId in selectors) {
        const container = document.getElementById(containerId);
        const selectId = selectors[containerId];

        container.innerHTML = '';

        if (players.length > 0) {
            const select = document.createElement('select');
            select.id = selectId;
            select.style.width = '100%';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select Player';
            select.appendChild(defaultOption);

            players.forEach(p => {
                const option = document.createElement('option');
                option.value = p.name;
                option.textContent = p.name;
                select.appendChild(option);
            });
            container.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = selectId;
            input.placeholder = 'Player Name';
            container.appendChild(input);
        }
    }
}

function saveData() {
    localStorage.setItem('monopolyBankerData', JSON.stringify(data));
    showOutput('Game data saved to local storage.');
}

function loadData() {
    const savedData = localStorage.getItem('monopolyBankerData');
    if (savedData) {
        data = JSON.parse(savedData);
        // Reset transaction history to reflect loaded data
        transactionHistory = [JSON.parse(JSON.stringify(data))];
        historyIndex = 0;
        
        showOutput('Game data loaded from local storage.');
        viewBalances();
        viewProperties();
        viewTransactions();
        renderPlayerSelectors();
    } else {
        showError('No saved data found.');
    }
}

function resetData() {
    localStorage.removeItem('monopolyBankerData');
    data = {
        players: [],
        properties: [],
        transactions: []
    };
    transactionHistory = [JSON.parse(JSON.stringify(data))];
    historyIndex = 0;
    showOutput('Game data has been reset.');
    viewBalances();
    viewProperties();
    viewTransactions();
    renderPlayerSelectors();
}

window.onload = function() {
    loadData(); // Attempt to load data on page load
    renderPlayerSelectors();
};

function addPlayer() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) return showError('Enter a player name.');
    if (getPlayer(name)) return showError('Player already exists.');
    
    data.players.push({name, balance: 25000});
    showOutput(`Added ${name} with Rs. 25000.`);
    document.getElementById('playerName').value = '';
    
    updateTransactionHistory();
    renderPlayerSelectors();
}

function addMoney() {
    const playerName = document.getElementById('addMoneyPlayer').value.trim();
    const amount = parseFloat(document.getElementById('addMoneyAmount').value);
    const reason = document.getElementById('addMoneyReason').value.trim();
    
    if (!playerName || isNaN(amount) || !reason) return showError('Invalid input for adding money.');
    
    const player = getPlayer(playerName);
    if (!player) return showError('Player not found.');
    
    player.balance += amount;
    data.transactions.push({
        type: 'money_added',
        amount: amount,
        from: null,
        to: playerName,
        property: null,
        desc: reason,
        timestamp: new Date().toISOString()
    });
    
    showOutput(`Added Rs. ${amount} to ${playerName}'s wallet. Reason: ${reason}`);
    document.getElementById('addMoneyAmount').value = '';
    document.getElementById('addMoneyReason').value = '';

    updateTransactionHistory();
    viewBalances();
}

function deductMoney() {
    const playerName = document.getElementById('deductMoneyPlayer').value.trim();
    const amount = parseFloat(document.getElementById('deductMoneyAmount').value);
    const reason = document.getElementById('deductMoneyReason').value.trim();
    
    if (!playerName || isNaN(amount) || !reason) return showError('Invalid input for deducting money.');
    
    const player = getPlayer(playerName);
    if (!player) return showError('Player not found.');
    if (player.balance < amount) return showError('Insufficient balance to deduct.');
    
    player.balance -= amount;
    data.transactions.push({
        type: 'money_deducted',
        amount: amount,
        from: playerName,
        to: null,
        property: null,
        desc: reason,
        timestamp: new Date().toISOString()
    });
    
    showOutput(`Deducted Rs. ${amount} from ${playerName}'s wallet. Reason: ${reason}`);
    document.getElementById('deductMoneyAmount').value = '';
    document.getElementById('deductMoneyReason').value = '';

    updateTransactionHistory();
    viewBalances();
}

function buyProperty() {
    const playerName = document.getElementById('buyPlayer').value.trim();
    const propName = document.getElementById('buyProperty').value.trim();
    const cost = parseFloat(document.getElementById('buyCost').value);
    if (!playerName || !propName || isNaN(cost)) return showError('Invalid input.');

    const player = getPlayer(playerName);
    if (!player) return showError('Player not found.');

    let prop = getProperty(propName);
    if (!prop) {
        prop = { name: propName, owner: null, building: 'None', buildPrice: 0 };
        data.properties.push(prop);
    }

    if (prop.owner) return showError('Property already owned.');
    if (player.balance < cost) return showError('Insufficient balance.');
    
    player.balance -= cost;
    prop.owner = playerName;
    data.transactions.push({
        type: 'property_buy',
        amount: cost,
        from: playerName,
        to: null,
        property: propName,
        desc: `Bought ${propName}`,
        timestamp: new Date().toISOString()
    });
    showOutput(`${playerName} bought ${propName} for Rs. ${cost}.`);
    
    updateTransactionHistory();
}

function buildOnProperty() {
    const propName = document.getElementById('buildProperty').value.trim();
    const buildingType = document.getElementById('buildingType').value;
    const buildPrice = parseFloat(document.getElementById('buildPrice').value);
    
    if (!propName || !buildingType || isNaN(buildPrice)) return showError('Invalid input.');
    
    const prop = getProperty(propName);
    if (!prop) return showError('Property not found. Please buy the property first.');
    if (!prop.owner) return showError('Property not owned. Buy it before building.');

    const player = getPlayer(prop.owner);
    if (player.balance < buildPrice) {
        return showError(`Insufficient balance for ${player.name} to build.`);
    }

    player.balance -= buildPrice;
    prop.building = buildingType;
    prop.buildPrice = buildPrice;

    data.transactions.push({
        type: 'build',
        amount: buildPrice,
        from: player.name,
        to: null,
        property: propName,
        desc: `Built ${buildingType} on ${propName}`,
        timestamp: new Date().toISOString()
    });

    showOutput(`Built ${buildingType} on ${propName} for Rs. ${buildPrice}.`);
    updateTransactionHistory();
    viewBalances();
    viewProperties();
}

function payRent() {
    const fromName = document.getElementById('rentFrom').value.trim();
    const toName = document.getElementById('rentTo').value.trim();
    const amount = parseFloat(document.getElementById('rentAmount').value);
    const propName = document.getElementById('rentProperty').value.trim();
    if (!fromName || !toName || isNaN(amount)) return showError('Invalid input.');
    const fromPlayer = getPlayer(fromName);
    const toPlayer = getPlayer(toName);
    if (!fromPlayer || !toPlayer) return showError('Player not found.');
    if (fromPlayer.balance < amount) return showError('Insufficient balance.');
    
    fromPlayer.balance -= amount;
    toPlayer.balance += amount;
    const desc = propName ? `Rent paid for ${propName}` : 'Rent paid';
    data.transactions.push({
        type: 'rent',
        amount: amount,
        from: fromName,
        to: toName,
        property: propName,
        desc: desc,
        timestamp: new Date().toISOString()
    });
    showOutput(`${fromName} paid Rs. ${amount} rent to ${toName}.`);

    updateTransactionHistory();
}

function payFine() {
    const playerName = document.getElementById('finePlayer').value.trim();
    const amount = parseFloat(document.getElementById('fineAmount').value);
    const toBank = document.getElementById('fineToBank').checked;
    if (!playerName || isNaN(amount)) return showError('Invalid input.');
    const player = getPlayer(playerName);
    if (!player) return showError('Player not found.');
    if (player.balance < amount) return showError('Insufficient balance.');
    player.balance -= amount;
    const to = toBank ? null : 'Free Parking';
    const desc = toBank ? 'Fine paid to bank' : 'Fine paid to Free Parking';
    data.transactions.push({
        type: 'fine',
        amount: amount,
        from: playerName,
        to: to,
        property: null,
        desc: desc,
        timestamp: new Date().toISOString()
    });
    showOutput(`${playerName} paid Rs. ${amount} fine.`);

    updateTransactionHistory();
}

function transferProperty() {
    const propName = document.getElementById('transferProperty').value.trim();
    const fromName = document.getElementById('transferFrom').value.trim();
    const toName = document.getElementById('transferTo').value.trim();
    const cost = parseFloat(document.getElementById('transferCost').value);

    if (!propName || !fromName || !toName || isNaN(cost)) {
        return showError('Invalid input for property transfer.');
    }

    const fromPlayer = getPlayer(fromName);
    const toPlayer = getPlayer(toName);
    const prop = getProperty(propName);

    if (!fromPlayer || !toPlayer) {
        return showError('One or both players not found.');
    }
    if (!prop) {
        return showError('Property not found.');
    }
    if (!prop.owner || prop.owner.toLowerCase() !== fromName.toLowerCase()) {
        return showError(`${fromName} does not own this property.`);
    }
    if (fromPlayer.balance < cost) {
        return showError(`Insufficient balance for ${fromName}.`);
    }

    // Update balances
    fromPlayer.balance += cost;
    toPlayer.balance -= cost;

    // Update property ownership
    prop.owner = toName;

    // Log the transaction
    data.transactions.push({
        type: 'property_transfer',
        amount: cost,
        from: fromName,
        to: toName,
        property: propName,
        desc: `Transferred ${propName} for Rs. ${cost}`,
        timestamp: new Date().toISOString()
    });

    showOutput(`Transferred ${propName} from ${fromName} to ${toName} for Rs. ${cost}.`);
    updateTransactionHistory();
    viewBalances();
    viewProperties();
}

function viewBalances() {
    const output = document.getElementById('balancesOutput');
    output.innerHTML = '<h3>Player Balances</h3><table><tr><th>Name</th><th>Balance</th></tr>' +
        data.players.map(p => `<tr><td>${p.name}</td><td>Rs. ${p.balance.toFixed(2)}</td></tr>`).join('') +
        '</table>';
}

function viewProperties() {
    const output = document.getElementById('propertiesOutput');
    output.innerHTML = '<h3>Properties</h3><table><tr><th>Name</th><th>Properties Owned</th><th>Building</th><th>Build Price</th></tr>' +
        data.properties.map(p => `<tr><td>${p.name}</td><td>${p.owner || 'Unowned'}</td><td>${p.building || 'None'}</td><td>Rs. ${p.buildPrice ? p.buildPrice.toFixed(2) : 0}</td></tr>`).join('') +
        '</table>';
}

function viewTransactions() {
    const output = document.getElementById('transactionsOutput');
    output.innerHTML = '<h3>Transactions</h3><table><tr><th>Timestamp</th><th>Type</th><th>Amount</th><th>From</th><th>To</th><th>Property</th><th>Description</th></tr>' +
        data.transactions.slice().reverse().map(t => 
            `<tr><td>${t.timestamp}</td><td>${t.type}</td><td>Rs. ${t.amount.toFixed(2)}</td><td>${t.from || ''}</td><td>${t.to || ''}</td><td>${t.property || ''}</td><td>${t.desc}</td></tr>`
        ).join('') +
        '</table>';
}

document.addEventListener('keyup', function(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        const activeElement = document.activeElement;
        const parentSection = activeElement.closest('section');
        if (parentSection) {
            const button = parentSection.querySelector('button');
            if (button) {
                button.click();
            }
        }
    }
});

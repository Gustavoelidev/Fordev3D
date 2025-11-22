document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const state = {
        printers: JSON.parse(localStorage.getItem('printers')) || [],
        filaments: JSON.parse(localStorage.getItem('filaments')) || [],
        accessories: JSON.parse(localStorage.getItem('accessories')) || [],
        models: JSON.parse(localStorage.getItem('models')) || [],
        selectedAccessories: [] // { id, name, price, qty }
    };

    // --- DOM ELEMENTS ---
    const els = {
        // Tabs
        tabs: document.querySelectorAll('.tab-btn'),
        contents: document.querySelectorAll('.tab-content'),

        // Calculator Inputs
        modelSelect: document.getElementById('modelSelect'),
        gcode: document.getElementById('gcode'),
        printerSelect: document.getElementById('printerSelect'),
        filamentSelect: document.getElementById('filamentSelect'),
        printTime: document.getElementById('printTime'),
        weight: document.getElementById('weight'),
        accessorySelect: document.getElementById('accessorySelect'),

        // Overheads
        failureRate: document.getElementById('failureRate'),
        monthlyFixedCost: document.getElementById('monthlyFixedCost'),
        monthlyOrders: document.getElementById('monthlyOrders'),
        markup: document.getElementById('markup'),

        // Displays
        finalPrice: document.getElementById('finalPriceDisplay'),
        netProfit: document.getElementById('netProfitDisplay'),
        materialCost: document.getElementById('materialCostDisplay'),
        energyCost: document.getElementById('energyCostDisplay'),
        accessoriesCost: document.getElementById('accessoriesCostDisplay'),
        overheadCost: document.getElementById('overheadCostDisplay'),
        totalCost: document.getElementById('totalCostDisplay'),

        // Lists
        printersList: document.getElementById('printersList'),
        filamentsList: document.getElementById('filamentsList'),
        accessoriesList: document.getElementById('accessoriesList'),
        modelsList: document.getElementById('modelsList'),
        selectedAccessoriesList: document.getElementById('selectedAccessories'),

        // New Item Inputs
        newPrinterName: document.getElementById('newPrinterName'),
        newPrinterPower: document.getElementById('newPrinterPower'),
        newFilamentName: document.getElementById('newFilamentName'),
        newFilamentPrice: document.getElementById('newFilamentPrice'),
        newAccessoryName: document.getElementById('newAccessoryName'),
        newAccessoryPrice: document.getElementById('newAccessoryPrice'),
        newModelName: document.getElementById('newModelName'),
        newModelTime: document.getElementById('newModelTime'),
        newModelWeight: document.getElementById('newModelWeight')
    };

    // --- TAB SYSTEM ---
    window.switchTab = (tabId) => {
        els.tabs.forEach(t => t.classList.remove('active'));
        els.contents.forEach(c => c.classList.remove('active'));

        document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    };

    // --- DATA MANAGEMENT ---
    function saveState() {
        localStorage.setItem('printers', JSON.stringify(state.printers));
        localStorage.setItem('filaments', JSON.stringify(state.filaments));
        localStorage.setItem('accessories', JSON.stringify(state.accessories));
        localStorage.setItem('models', JSON.stringify(state.models));
        renderAll();
        calculate();
    }

    window.addPrinter = () => {
        const name = els.newPrinterName.value;
        const power = parseFloat(els.newPrinterPower.value);
        if (name && power) {
            state.printers.push({ id: Date.now(), name, power });
            els.newPrinterName.value = '';
            els.newPrinterPower.value = '';
            saveState();
        }
    };

    window.addFilament = () => {
        const name = els.newFilamentName.value;
        const price = parseFloat(els.newFilamentPrice.value);
        if (name && price) {
            state.filaments.push({ id: Date.now(), name, price });
            els.newFilamentName.value = '';
            els.newFilamentPrice.value = '';
            saveState();
        }
    };

    window.addAccessory = () => {
        const name = els.newAccessoryName.value;
        const price = parseFloat(els.newAccessoryPrice.value);
        if (name && !isNaN(price)) {
            state.accessories.push({ id: Date.now(), name, price });
            els.newAccessoryName.value = '';
            els.newAccessoryPrice.value = '';
            saveState();
        }
    };

    window.addModel = () => {
        const name = els.newModelName.value;
        const time = parseFloat(els.newModelTime.value);
        const weight = parseFloat(els.newModelWeight.value);
        if (name && time && weight) {
            state.models.push({ id: Date.now(), name, time, weight });
            els.newModelName.value = '';
            els.newModelTime.value = '';
            els.newModelWeight.value = '';
            saveState();
        }
    };

    window.deleteItem = (type, id) => {
        state[type] = state[type].filter(item => item.id !== id);
        saveState();
    };

    // --- CALCULATOR LOGIC ---
    window.loadModelFromList = () => {
        const id = parseInt(els.modelSelect.value);
        const model = state.models.find(m => m.id === id);
        if (model) {
            els.gcode.value = model.name;
            els.printTime.value = model.time;
            els.weight.value = model.weight;
            calculate();
        }
    };

    window.addAccessoryToCalc = () => {
        const id = parseInt(els.accessorySelect.value);
        if (!id) return;

        const item = state.accessories.find(a => a.id === id);
        if (item) {
            state.selectedAccessories.push({ ...item, uid: Date.now() }); // uid for unique list items
            renderSelectedAccessories();
            calculate();
        }
    };

    window.removeAccessoryFromCalc = (uid) => {
        state.selectedAccessories = state.selectedAccessories.filter(a => a.uid !== uid);
        renderSelectedAccessories();
        calculate();
    };

    function calculate() {
        // Get Selected Resources
        const printerId = parseInt(els.printerSelect.value);
        const filamentId = parseInt(els.filamentSelect.value);

        const printer = state.printers.find(p => p.id === printerId) || { power: 0 };
        const filament = state.filaments.find(f => f.id === filamentId) || { price: 0 };

        // Inputs
        const time = parseFloat(els.printTime.value) || 0;
        const weight = parseFloat(els.weight.value) || 0;
        const failRate = parseFloat(els.failureRate.value) || 0;
        const fixedMonthly = parseFloat(els.monthlyFixedCost.value) || 0;
        const monthlyOrders = parseFloat(els.monthlyOrders.value) || 1;
        const markup = parseFloat(els.markup.value) || 1;

        // Costs
        const materialCost = (weight / 1000) * filament.price;
        const energyRate = 0.85;
        const energyCost = (printer.power / 1000) * time * energyRate;

        const accessoriesCost = state.selectedAccessories.reduce((sum, item) => sum + item.price, 0);

        const fixedCostPerUnit = fixedMonthly / monthlyOrders;

        // Failure Cost
        const productionCost = materialCost + energyCost;
        const failureCost = productionCost * (failRate / 100);

        const totalCost = productionCost + fixedCostPerUnit + failureCost + accessoriesCost;

        const sellingPrice = totalCost * markup;
        const profit = sellingPrice - totalCost;

        // Update UI
        const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

        els.materialCost.textContent = fmt(materialCost);
        els.energyCost.textContent = fmt(energyCost);
        els.accessoriesCost.textContent = fmt(accessoriesCost);
        els.overheadCost.textContent = fmt(fixedCostPerUnit + failureCost);
        els.totalCost.textContent = fmt(totalCost);

        els.finalPrice.textContent = fmt(sellingPrice);
        els.netProfit.textContent = fmt(profit);
    }

    // --- PDF GENERATION ---
    window.generatePDF = () => {
        // Populate PDF Template
        const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

        document.getElementById('pdfDate').textContent = `Data: ${new Date().toLocaleDateString('pt-BR')}`;
        document.getElementById('pdfModelName').textContent = els.gcode.value || 'Modelo Personalizado';

        const printer = state.printers.find(p => p.id == els.printerSelect.value);
        document.getElementById('pdfPrinter').textContent = printer ? printer.name : 'Não especificada';

        const filament = state.filaments.find(f => f.id == els.filamentSelect.value);
        document.getElementById('pdfFilament').textContent = filament ? filament.name : 'Não especificado';

        // Get calculated values
        const material = parseFloat(els.materialCost.textContent.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
        const energy = parseFloat(els.energyCost.textContent.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
        const accessories = parseFloat(els.accessoriesCost.textContent.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
        const total = els.finalPrice.textContent;

        document.getElementById('pdfProductionCost').textContent = fmt(material + energy);
        document.getElementById('pdfAccessoriesCost').textContent = fmt(accessories);
        document.getElementById('pdfTotal').textContent = total;

        // Generate
        const element = document.getElementById('pdf-template');
        element.style.display = 'block'; // Show temporarily

        const opt = {
            margin: 0,
            filename: `orcamento_${els.gcode.value || '3d'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            element.style.display = 'none'; // Hide again
        });
    };

    // --- RENDERING ---
    function renderAll() {
        renderList(state.printers, els.printersList, 'printers', 'power', 'W');
        renderList(state.filaments, els.filamentsList, 'filaments', 'price', 'R$/kg');
        renderList(state.accessories, els.accessoriesList, 'accessories', 'price', 'R$');
        renderList(state.models, els.modelsList, 'models', 'time', 'h');

        renderSelects();
    }

    function renderList(items, container, type, subKey, unit) {
        container.innerHTML = items.map(item => `
            <div class="data-item">
                <div class="data-info">
                    <h4>${item.name}</h4>
                    <p>${item[subKey]} ${unit} ${type === 'models' ? `| ${item.weight}g` : ''}</p>
                </div>
                <button class="btn btn-danger" onclick="deleteItem('${type}', ${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    function renderSelects() {
        // Save current selection
        const currentPrinter = els.printerSelect.value;
        const currentFilament = els.filamentSelect.value;
        const currentAccessory = els.accessorySelect.value;
        const currentModel = els.modelSelect.value;

        els.printerSelect.innerHTML = '<option value="">Selecione...</option>' +
            state.printers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        els.filamentSelect.innerHTML = '<option value="">Selecione...</option>' +
            state.filaments.map(f => `<option value="${f.id}">${f.name}</option>`).join('');

        els.accessorySelect.innerHTML = '<option value="">Selecione...</option>' +
            state.accessories.map(a => `<option value="${a.id}">${a.name} - R$ ${a.price}</option>`).join('');

        els.modelSelect.innerHTML = '<option value="">Carregar Modelo Salvo...</option>' +
            state.models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

        // Restore selection if possible
        els.printerSelect.value = currentPrinter;
        els.filamentSelect.value = currentFilament;
        els.accessorySelect.value = currentAccessory;
        els.modelSelect.value = currentModel;
    }

    function renderSelectedAccessories() {
        els.selectedAccessoriesList.innerHTML = state.selectedAccessories.map(item => `
            <div class="data-item" style="padding: 8px; font-size: 0.9rem;">
                <span>${item.name}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>R$ ${item.price.toFixed(2)}</span>
                    <button class="btn btn-danger" style="padding: 4px 8px;" onclick="removeAccessoryFromCalc(${item.uid})">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // --- INITIALIZATION ---
    // Add listeners to inputs
    [els.printTime, els.weight, els.failureRate, els.monthlyFixedCost, els.monthlyOrders, els.markup, els.printerSelect, els.filamentSelect]
        .forEach(input => input.addEventListener('input', calculate));

    // Initial Render
    if (state.printers.length === 0) {
        // Add some defaults if empty
        state.printers.push({ id: 1, name: 'Bambu Lab A1', power: 150 });
        state.filaments.push({ id: 1, name: 'PLA Genérico', price: 85.00 });
        saveState();
    } else {
        renderAll();
        calculate();
    }
});

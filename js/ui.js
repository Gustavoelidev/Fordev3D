import { fmt } from './utils.js';

export class UI {
    constructor(store, onAction) {
        this.store = store;
        this.onAction = onAction; // Callback for actions like delete, add, etc.

        this.els = {
            tabs: document.querySelectorAll('.tab-btn'),
            contents: document.querySelectorAll('.tab-content'),

            // Lists
            printersList: document.getElementById('printersList'),
            filamentsList: document.getElementById('filamentsList'),
            accessoriesList: document.getElementById('accessoriesList'),
            modelsList: document.getElementById('modelsList'),
            selectedAccessoriesList: document.getElementById('selectedAccessories'),

            // Selects
            printerSelect: document.getElementById('printerSelect'),
            filamentSelect: document.getElementById('filamentSelect'),
            accessorySelect: document.getElementById('accessorySelect'),
            modelSelect: document.getElementById('modelSelect'),

            // Displays
            finalPrice: document.getElementById('finalPriceDisplay'),
            netProfit: document.getElementById('netProfitDisplay'),
            materialCost: document.getElementById('materialCostDisplay'),
            energyCost: document.getElementById('energyCostDisplay'),
            accessoriesCost: document.getElementById('accessoriesCostDisplay'),
            overheadCost: document.getElementById('overheadCostDisplay'),
            totalCost: document.getElementById('totalCostDisplay'),
        };

        this.initTabs();
    }

    initTabs() {
        window.switchTab = (tabId) => {
            this.els.tabs.forEach(t => t.classList.remove('active'));
            this.els.contents.forEach(c => c.classList.remove('active'));

            const btn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
            if (btn) btn.classList.add('active');

            const content = document.getElementById(tabId);
            if (content) content.classList.add('active');
        };
    }

    render(state) {
        this.renderList(state.printers, this.els.printersList, 'printers', 'power', 'W');
        this.renderList(state.filaments, this.els.filamentsList, 'filaments', 'price', 'R$/kg');
        this.renderList(state.accessories, this.els.accessoriesList, 'accessories', 'price', 'R$');
        this.renderList(state.models, this.els.modelsList, 'models', 'time', 'h');

        this.renderSelects(state);
        this.renderSelectedAccessories(state.selectedAccessories);
    }

    renderList(items, container, type, subKey, unit) {
        container.innerHTML = items.map(item => `
            <div class="data-item">
                <div class="data-info">
                    <h4>${item.name}</h4>
                    <p>${item[subKey]} ${unit} ${type === 'models' ? `| ${item.weight}g` : ''}</p>
                </div>
                <button class="btn btn-danger" data-action="delete" data-type="${type}" data-id="${item.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Add event listeners to new buttons
        container.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.onAction('delete', btn.dataset.type, parseInt(btn.dataset.id));
            });
        });
    }

    renderSelects(state) {
        const updateSelect = (el, items, labelFn) => {
            const current = el.value;
            el.innerHTML = `<option value="">Selecione...</option>` +
                items.map(item => `<option value="${item.id}">${labelFn(item)}</option>`).join('');
            el.value = current;
        };

        updateSelect(this.els.printerSelect, state.printers, p => p.name);
        updateSelect(this.els.filamentSelect, state.filaments, f => f.name);
        updateSelect(this.els.accessorySelect, state.accessories, a => `${a.name} - R$ ${a.price}`);

        // Model select is special
        const currentModel = this.els.modelSelect.value;
        this.els.modelSelect.innerHTML = '<option value="">Carregar Modelo Salvo...</option>' +
            state.models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        this.els.modelSelect.value = currentModel;
    }

    renderSelectedAccessories(items) {
        this.els.selectedAccessoriesList.innerHTML = items.map(item => `
            <div class="data-item" style="padding: 8px; font-size: 0.9rem;">
                <span>${item.name}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>R$ ${item.price.toFixed(2)}</span>
                    <button class="btn btn-danger" style="padding: 4px 8px;" data-action="removeAccessory" data-uid="${item.uid}">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.els.selectedAccessoriesList.querySelectorAll('button[data-action="removeAccessory"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.onAction('removeAccessory', null, parseInt(btn.dataset.uid));
            });
        });
    }

    updateResults(results) {
        this.els.materialCost.textContent = fmt(results.materialCost);
        this.els.energyCost.textContent = fmt(results.energyCost);
        this.els.accessoriesCost.textContent = fmt(results.accessoriesCost);
        this.els.overheadCost.textContent = fmt(results.overheadCost);
        this.els.totalCost.textContent = fmt(results.totalCost);
        this.els.finalPrice.textContent = fmt(results.sellingPrice);
        this.els.netProfit.textContent = fmt(results.profit);
    }

    // Getters for inputs
    getInputs() {
        return {
            printerId: parseInt(this.els.printerSelect.value),
            filamentId: parseInt(this.els.filamentSelect.value),
            time: parseFloat(document.getElementById('printTime').value) || 0,
            weight: parseFloat(document.getElementById('weight').value) || 0,
            failRate: parseFloat(document.getElementById('failureRate').value) || 0,
            fixedMonthly: parseFloat(document.getElementById('monthlyFixedCost').value) || 0,
            monthlyOrders: parseFloat(document.getElementById('monthlyOrders').value) || 1,
            markup: parseFloat(document.getElementById('markup').value) || 1,
        };
    }

    clearNewItemInputs(type) {
        if (type === 'printer') {
            document.getElementById('newPrinterName').value = '';
            document.getElementById('newPrinterPower').value = '';
        } else if (type === 'filament') {
            document.getElementById('newFilamentName').value = '';
            document.getElementById('newFilamentPrice').value = '';
        } else if (type === 'accessory') {
            document.getElementById('newAccessoryName').value = '';
            document.getElementById('newAccessoryPrice').value = '';
        } else if (type === 'model') {
            document.getElementById('newModelName').value = '';
            document.getElementById('newModelTime').value = '';
            document.getElementById('newModelWeight').value = '';
        }
    }

    setModelInputs(model) {
        document.getElementById('gcode').value = model.name;
        document.getElementById('printTime').value = model.time;
        document.getElementById('weight').value = model.weight;
    }
}

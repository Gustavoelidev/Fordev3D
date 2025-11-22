import { Store } from './store.js';
import { UI } from './ui.js';
import { Calculator } from './calculator.js';
import { PDFGenerator } from './pdf.js';

document.addEventListener('DOMContentLoaded', () => {
    const store = new Store();

    // Action Handler
    const handleAction = (action, type, id) => {
        if (action === 'delete') {
            store.deleteItem(type, id);
        } else if (action === 'removeAccessory') {
            store.removeSelectedAccessory(id); // id here is uid
        }
    };

    const ui = new UI(store, handleAction);

    // Subscribe UI to Store changes
    store.subscribe((state) => {
        ui.render(state);
        recalculate();
    });

    // --- Calculation Logic ---
    function recalculate() {
        const inputs = ui.getInputs();
        const printer = store.getPrinter(inputs.printerId);
        const filament = store.getFilament(inputs.filamentId);

        const results = Calculator.calculate({
            ...inputs,
            printer,
            filament,
            accessories: store.state.selectedAccessories
        });

        ui.updateResults(results);
    }

    // --- Event Listeners ---

    // Inputs triggering calculation
    const calcInputs = [
        'printTime', 'weight', 'failureRate', 'monthlyFixedCost',
        'monthlyOrders', 'markup', 'printerSelect', 'filamentSelect'
    ];
    calcInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', recalculate);
    });

    // Add Item Buttons
    window.addPrinter = () => {
        const name = document.getElementById('newPrinterName').value;
        const power = parseFloat(document.getElementById('newPrinterPower').value);
        if (name && power) {
            store.addPrinter({ name, power });
            ui.clearNewItemInputs('printer');
        }
    };

    window.addFilament = () => {
        const name = document.getElementById('newFilamentName').value;
        const price = parseFloat(document.getElementById('newFilamentPrice').value);
        if (name && price) {
            store.addFilament({ name, price });
            ui.clearNewItemInputs('filament');
        }
    };

    window.addAccessory = () => {
        const name = document.getElementById('newAccessoryName').value;
        const price = parseFloat(document.getElementById('newAccessoryPrice').value);
        if (name && !isNaN(price)) {
            store.addAccessory({ name, price });
            ui.clearNewItemInputs('accessory');
        }
    };

    window.addModel = () => {
        const name = document.getElementById('newModelName').value;
        const time = parseFloat(document.getElementById('newModelTime').value);
        const weight = parseFloat(document.getElementById('newModelWeight').value);
        if (name && time && weight) {
            store.addModel({ name, time, weight });
            ui.clearNewItemInputs('model');
        }
    };

    // Calculator Actions
    window.loadModelFromList = () => {
        const id = parseInt(document.getElementById('modelSelect').value);
        const model = store.getModel(id);
        if (model) {
            ui.setModelInputs(model);
            recalculate();
        }
    };

    window.addAccessoryToCalc = () => {
        const id = parseInt(document.getElementById('accessorySelect').value);
        if (id) {
            store.addSelectedAccessory(id);
        }
    };

    window.generatePDF = () => {
        const inputs = ui.getInputs();
        const printer = store.getPrinter(inputs.printerId);
        const filament = store.getFilament(inputs.filamentId);

        const results = Calculator.calculate({
            ...inputs,
            printer,
            filament,
            accessories: store.state.selectedAccessories
        });

        PDFGenerator.generate({
            modelName: document.getElementById('gcode').value,
            printerName: printer ? printer.name : '',
            filamentName: filament ? filament.name : '',
            costs: results,
            totalPrice: results.sellingPrice
        });
    };

    // Initial Load
    if (store.state.printers.length === 0) {
        store.addPrinter({ name: 'Bambu Lab A1', power: 150 });
        store.addFilament({ name: 'PLA Genérico', price: 85.00 });
    } else {
        store.notify(); // Trigger initial render
    }
});

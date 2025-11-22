export class Store {
    constructor() {
        this.state = {
            printers: JSON.parse(localStorage.getItem('printers')) || [],
            filaments: JSON.parse(localStorage.getItem('filaments')) || [],
            accessories: JSON.parse(localStorage.getItem('accessories')) || [],
            models: JSON.parse(localStorage.getItem('models')) || [],
            selectedAccessories: [] // { id, name, price, qty, uid }
        };
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    save() {
        localStorage.setItem('printers', JSON.stringify(this.state.printers));
        localStorage.setItem('filaments', JSON.stringify(this.state.filaments));
        localStorage.setItem('accessories', JSON.stringify(this.state.accessories));
        localStorage.setItem('models', JSON.stringify(this.state.models));
        this.notify();
    }

    // --- Actions ---

    addPrinter(printer) {
        this.state.printers.push({ ...printer, id: Date.now() });
        this.save();
    }

    addFilament(filament) {
        this.state.filaments.push({ ...filament, id: Date.now() });
        this.save();
    }

    addAccessory(accessory) {
        this.state.accessories.push({ ...accessory, id: Date.now() });
        this.save();
    }

    addModel(model) {
        this.state.models.push({ ...model, id: Date.now() });
        this.save();
    }

    deleteItem(type, id) {
        if (this.state[type]) {
            this.state[type] = this.state[type].filter(item => item.id !== id);
            this.save();
        }
    }

    // --- Calculator Specific Actions ---

    addSelectedAccessory(accessoryId) {
        const item = this.state.accessories.find(a => a.id === accessoryId);
        if (item) {
            this.state.selectedAccessories.push({ ...item, uid: Date.now() });
            this.notify();
        }
    }

    removeSelectedAccessory(uid) {
        this.state.selectedAccessories = this.state.selectedAccessories.filter(a => a.uid !== uid);
        this.notify();
    }

    getModel(id) {
        return this.state.models.find(m => m.id === id);
    }

    getPrinter(id) {
        return this.state.printers.find(p => p.id === id);
    }

    getFilament(id) {
        return this.state.filaments.find(f => f.id === id);
    }
}

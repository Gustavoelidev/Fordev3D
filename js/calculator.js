export class Calculator {
    static calculate(inputs) {
        const {
            printer,
            filament,
            time,
            weight,
            failRate,
            fixedMonthly,
            monthlyOrders,
            markup,
            accessories
        } = inputs;

        // Defaults
        const printerPower = printer ? printer.power : 0;
        const filamentPrice = filament ? filament.price : 0;

        // Costs
        const materialCost = (weight / 1000) * filamentPrice;
        const energyRate = 0.85; // R$/kWh (average)
        const energyCost = (printerPower / 1000) * time * energyRate;

        const accessoriesCost = accessories.reduce((sum, item) => sum + item.price, 0);

        const fixedCostPerUnit = monthlyOrders > 0 ? fixedMonthly / monthlyOrders : 0;

        // Failure Cost
        const productionCost = materialCost + energyCost;
        const failureCost = productionCost * (failRate / 100);

        const totalCost = productionCost + fixedCostPerUnit + failureCost + accessoriesCost;

        const sellingPrice = totalCost * markup;
        const profit = sellingPrice - totalCost;

        return {
            materialCost,
            energyCost,
            accessoriesCost,
            overheadCost: fixedCostPerUnit + failureCost,
            totalCost,
            sellingPrice,
            profit
        };
    }
}

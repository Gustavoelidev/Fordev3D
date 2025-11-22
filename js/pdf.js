import { fmt } from './utils.js';

export class PDFGenerator {
    static generate(data) {
        const {
            modelName,
            printerName,
            filamentName,
            costs,
            totalPrice
        } = data;

        // Populate Template
        document.getElementById('pdfDate').textContent = new Date().toLocaleDateString('pt-BR');
        document.getElementById('pdfModelName').textContent = modelName || 'Modelo Personalizado';
        document.getElementById('pdfPrinter').textContent = printerName || 'Não especificada';
        document.getElementById('pdfFilament').textContent = filamentName || 'Não especificado';
        document.getElementById('pdfNumber').textContent = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        const productionCost = costs.materialCost + costs.energyCost;

        document.getElementById('pdfProductionCost').textContent = fmt(productionCost);
        document.getElementById('pdfAccessoriesCost').textContent = fmt(costs.accessoriesCost);
        document.getElementById('pdfTotal').textContent = fmt(totalPrice);

        // Generate
        const element = document.getElementById('pdf-template');
        element.style.display = 'block';

        const opt = {
            margin: 0,
            filename: `orcamento_${modelName || '3d'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        // We use the global html2pdf from the CDN script
        html2pdf().set(opt).from(element).save().then(() => {
            element.style.display = 'none';
        });
    }
}

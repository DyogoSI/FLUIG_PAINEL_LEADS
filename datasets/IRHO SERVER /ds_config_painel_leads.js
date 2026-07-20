function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    
    // Cria as colunas
    dataset.addColumn("idPasta");
    dataset.addColumn("idFormulario");
    
    // ADICIONE AQUI OS IDs REAIS DO SEU AMBIENTE FLUIG
    // "2" -> ID da pasta onde os registros (cards) do formulário serão salvos
    // "540" -> ID do formulário base que você exportou no Passo 1
    dataset.addRow(new Array("1554", "1555")); 
    
    return dataset;
}
function onMobileSync(user) {}
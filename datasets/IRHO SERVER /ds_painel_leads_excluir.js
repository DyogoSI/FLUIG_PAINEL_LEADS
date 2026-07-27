function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("resultado");
    dataset.addColumn("mensagem");

    var conn = null;
    var pstmt = null;

    try {
        var idInformado = null;
        if (constraints != null) {
            for (var i = 0; i < constraints.length; i++) {
                if (String(constraints[i].getFieldName()) === "id") { idInformado = constraints[i].getInitialValue(); }
            }
        }

        if (idInformado == null || String(idInformado).trim() === "" || parseInt(idInformado, 10) <= 0) {
            dataset.addRow(["erro", "id nao informado"]);
            return dataset;
        }

        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        pstmt = conn.prepareStatement("UPDATE PAINEL_LEADS_DADOS SET lead_status = 'Excluido', data_atualizacao = GETDATE() WHERE id = ?");
        pstmt.setInt(1, parseInt(idInformado, 10));
        pstmt.executeUpdate();

        dataset.addRow(["ok", ""]);
    } catch (e) {
        dataset.addRow(["erro", e.toString()]);
    } finally {
        if (pstmt != null) { try { pstmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}

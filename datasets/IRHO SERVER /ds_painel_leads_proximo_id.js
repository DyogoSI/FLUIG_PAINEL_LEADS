function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("proximoId");

    var conn = null;
    var stmt = null;
    var rs = null;

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        stmt = conn.createStatement();
        rs = stmt.executeQuery("SELECT ISNULL(MAX(TRY_CAST(lead_id AS INT)), 0) AS maior FROM PAINEL_LEADS_DADOS");

        var maior = 0;
        if (rs.next()) { maior = rs.getInt("maior"); }

        dataset.addRow([String(maior + 1)]);
    } catch (e) {
        dataset.addRow(["1"]);
    } finally {
        if (rs != null) { try { rs.close(); } catch(e) {} }
        if (stmt != null) { try { stmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}

function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("fonte_insercao");

    var conn = null;
    var stmt = null;
    var rs = null;

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        var query = "SELECT DISTINCT fonte_insercao FROM PAINEL_LEADS_DADOS " +
                    "WHERE (lead_status IS NULL OR lead_status NOT LIKE 'Exclu%') " +
                    "AND fonte_insercao IS NOT NULL AND fonte_insercao <> '' " +
                    "AND fonte_insercao <> 'Manualmente' AND fonte_insercao NOT LIKE 'Diagn%'";

        stmt = conn.createStatement();
        rs = stmt.executeQuery(query);

        while (rs.next()) {
            dataset.addRow([rs.getString("fonte_insercao") || ""]);
        }
    } catch (e) {
        // silencioso: lista de arquivos é auxiliar, não deve travar o painel se falhar
    } finally {
        if (rs != null) { try { rs.close(); } catch(e) {} }
        if (stmt != null) { try { stmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}

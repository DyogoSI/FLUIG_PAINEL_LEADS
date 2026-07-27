function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("existe");

    var conn = null;
    var pstmt = null;
    var rs = null;

    try {
        var email = "";
        var idAtual = "";
        if (constraints != null) {
            for (var i = 0; i < constraints.length; i++) {
                var nomeCampo = String(constraints[i].getFieldName());
                if (nomeCampo === "email") { email = constraints[i].getInitialValue(); }
                if (nomeCampo === "idAtual") { idAtual = constraints[i].getInitialValue(); }
            }
        }

        email = String(email || "").trim();
        if (email === "") {
            dataset.addRow(["nao"]);
            return dataset;
        }

        var idAtualNumerico = parseInt(idAtual, 10);
        var temIdAtual = !isNaN(idAtualNumerico) && idAtualNumerico > 0;

        var query = "SELECT COUNT(*) AS total FROM PAINEL_LEADS_DADOS " +
                    "WHERE LOWER(lead_email) = LOWER(?) " +
                    "AND (lead_status IS NULL OR lead_status NOT LIKE 'Exclu%')" +
                    (temIdAtual ? " AND id <> ?" : "");

        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        pstmt = conn.prepareStatement(query);
        pstmt.setString(1, email);
        if (temIdAtual) { pstmt.setInt(2, idAtualNumerico); }

        rs = pstmt.executeQuery();
        var total = 0;
        if (rs.next()) { total = rs.getInt("total"); }

        dataset.addRow([total > 0 ? "sim" : "nao"]);
    } catch (e) {
        dataset.addRow(["nao"]);
    } finally {
        if (rs != null) { try { rs.close(); } catch(e) {} }
        if (pstmt != null) { try { pstmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}

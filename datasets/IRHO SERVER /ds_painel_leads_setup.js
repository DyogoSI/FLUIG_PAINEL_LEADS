function defineStructure() {}
function onSync(lastSyncDate) {}

function criarIndiceSeNaoExistir(stmt, nomeIndice, definicaoColunas) {
    var rsIdx = stmt.executeQuery("SELECT COUNT(*) AS total FROM sys.indexes WHERE name = '" + nomeIndice + "'");
    var existe = false;
    if (rsIdx.next()) { existe = rsIdx.getInt("total") > 0; }
    rsIdx.close();
    if (!existe) {
        stmt.execute("CREATE INDEX " + nomeIndice + " ON PAINEL_LEADS_DADOS (" + definicaoColunas + ")");
        return true;
    }
    return false;
}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("resultado");

    var conn = null;
    var stmt = null;
    var rs = null;

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        stmt = conn.createStatement();
        rs = stmt.executeQuery("SELECT COUNT(*) AS total FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PAINEL_LEADS_DADOS'");
        var existe = false;
        if (rs.next()) { existe = rs.getInt("total") > 0; }
        rs.close();

        var mensagemTabela;
        if (existe) {
            mensagemTabela = "tabela ja existia";
        } else {
            stmt.execute(
                "CREATE TABLE PAINEL_LEADS_DADOS (" +
                "id INT IDENTITY(1,1) PRIMARY KEY, " +
                "lead_id VARCHAR(50), " +
                "lead_nome VARCHAR(255), " +
                "lead_cargo VARCHAR(255), " +
                "lead_telefone VARCHAR(50), " +
                "lead_email VARCHAR(255), " +
                "lead_linkedin VARCHAR(500), " +
                "empresa_nome VARCHAR(255), " +
                "empresa_cnpj VARCHAR(50), " +
                "empresa_site VARCHAR(255), " +
                "lead_origem VARCHAR(100), " +
                "lead_status VARCHAR(50), " +
                "fonte_insercao VARCHAR(255), " +
                "dados_extras NVARCHAR(MAX), " +
                "data_criacao DATETIME DEFAULT GETDATE(), " +
                "data_atualizacao DATETIME DEFAULT GETDATE()" +
                ")"
            );
            mensagemTabela = "tabela criada com sucesso";
        }

        // Índices necessários pra aguentar 100 mil+ registros sem virar varredura completa
        // a cada busca/filtro. Idempotente: só cria o que ainda não existe, seguro rodar de novo.
        var indicesCriados = [];
        if (criarIndiceSeNaoExistir(stmt, "IX_PAINEL_LEADS_status", "lead_status")) { indicesCriados.push("status"); }
        if (criarIndiceSeNaoExistir(stmt, "IX_PAINEL_LEADS_email", "lead_email")) { indicesCriados.push("email"); }
        if (criarIndiceSeNaoExistir(stmt, "IX_PAINEL_LEADS_fonte", "fonte_insercao")) { indicesCriados.push("fonte_insercao"); }
        if (criarIndiceSeNaoExistir(stmt, "IX_PAINEL_LEADS_lead_id", "lead_id")) { indicesCriados.push("lead_id"); }

        dataset.addRow([mensagemTabela + " | indices criados agora: " + (indicesCriados.length > 0 ? indicesCriados.join(", ") : "nenhum (ja existiam)")]);
    } catch (e) {
        dataset.addRow(["erro: " + e.toString()]);
    } finally {
        if (rs != null) { try { rs.close(); } catch(e) {} }
        if (stmt != null) { try { stmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}

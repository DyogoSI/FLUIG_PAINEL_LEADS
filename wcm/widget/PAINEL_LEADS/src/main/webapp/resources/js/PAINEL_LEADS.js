var PainelLeadsWidget = SuperWidget.extend({
    itensPorPagina: 10,
    paginaAtual: 1,
    todosOsLeadsMemoria: [], // <-- Memória ativada: guarda os leads sem travar a tela
    totalFiltrado: 0, 
    ultimaFonteInserida: null,
    filtroFonte: 'todos',
    ordenacaoColuna: 'idContato',
    ordenacaoDirecao: 'desc',
    fonteAtualModal: 'Manualmente',
    diagnosticoIdSelecionado: null,

    modoEdicao: false,
    linhaEmEdicao: null,
    idPastaFluig: null,
    idFormularioFluig: null,
    nomeDatasetLeads: "DSleads",

    graficoStatus: null,
    graficoMetodo: null,

    // Cache local (localStorage): evita que o usuario tenha que esperar o
    // carregamento completo dos leads toda vez que abrir/atualizar o painel.
    chaveCacheLeads: 'painelLeadsCache_v1',
    cacheLeadsDebounceTimer: null,
    chaveContadorIdLead: 'painelLeadsContadorId_v1',

    init: function() {
        this.bindEvents();
        this.inicializarGraficos();
        this.carregarConfiguracaoFluig();
    },

    bindings: { local: {}, global: {} },

    bindEvents: function() {
        var that = this;
        var dom = this.DOM;
        dom.find('.btn-add-record').on('click', function() { that.abrirModalNovo(); });
        dom.find('.btn-close-modal').on('click', function() { that.fecharModal(); });
        dom.find('.btn-cancel-modal').on('click', function() { that.fecharModal(); });
        dom.find('.btn-delete-lead-modal').on('click', function() { that.excluirLeadDoModal(); });
        dom.find('.form-add-lead').on('submit', function(e) { e.preventDefault(); that.salvarLead(); });
        dom.find('.lead-email').on('input blur', function() { that.verificarEmailDuplicadoNoModal(); });
        dom.find('.btn-fill-test').on('click', function() { that.preencherDadosTeste(); });
        dom.find('.btn-import-file').on('click', function() { that.abrirSeletorArquivo(); });
        dom.find('.btn-escolher-diagnostico').off('click').on('click', function() { that.abrirModalEscolherDiagnostico(); });
        dom.find('.btn-sync').off('click').on('click', function(e) { e.preventDefault(); e.stopPropagation(); that.sincronizarDados(); });
        dom.find('.file-input').on('change', function(e) { that.processarArquivo(e); });
        
        dom.find('.search-input').on('input', function() { that.pesquisarLead(); });
        dom.find('.filter-status').on('change', function() { that.paginaAtual = 1; that.atualizarPainelCompleto(); });
        dom.find('.filter-method').on('change', function() { that.paginaAtual = 1; that.atualizarPainelCompleto(); });
        dom.find('.filter-column').on('change', function() { that.paginaAtual = 1; that.atualizarPainelCompleto(); });
        dom.find('.filter-tipo-registro').on('change', function() { that.paginaAtual = 1; that.atualizarPainelCompleto(); });

        dom.find('.lead-tipo-registro').on('change', function() {
            dom.find('.tipo-registro-option').removeClass('selecionado');
            $(this).closest('.tipo-registro-option').addClass('selecionado');
        });
        dom.find('.filter-text').on('input', function() { that.pesquisarLead(); });
        dom.find('.btn-reset').on('click', function() { that.limparPesquisa(); });
        dom.find('.select-limite').on('change', function(e) { that.mudarLimiteExibicao(e.target); });
        dom.find('.btn-prev').on('click', function() { that.paginaAnterior(); });
        dom.find('.btn-next').on('click', function() { that.proximaPagina(); });
        
        dom.find('.btn-select-all-global').on('click', function() { that.selecionarTodosGlobal(); });
        dom.find('.btn-cancel-selection').on('click', function() { that.alternarModoSelecao(false); });
        dom.find('.chk-select-all').on('change', function(e) { that.toggleSelectAll(e); });
        
        dom.find('.table-body').on('change', '.chk-lead-select', function(e) {
            var tr = $(e.currentTarget).closest('tr');
            if($(e.currentTarget).is(':checked')) { tr.addClass('selected-row'); }
            else { tr.removeClass('selected-row'); }
            that.verificarSelecao();
        });
        
        dom.find('.btn-edit-selected').on('click', function() {
            var selecionado = that.DOM.find('.table-body tr.selected-row:visible').first();
            if(selecionado.length) { that.abrirModalEdicao(selecionado); }
        });
        
        dom.find('.btn-delete-selected').on('click', function() { that.excluirSelecionados(); });

        dom.find('.th-sortable').on('click', function() { that.ordenarPorColuna($(this).data('campo')); });

        dom.find('.table-body').on('dblclick', 'tr.hoverable', function(e) {
            if ($(e.target).is('a, input, button') || $(e.target).closest('a, button').length) return;
            that.abrirModalEdicao($(this));
        });
    },

    ordenarPorColuna: function(campo) {
        if (this.ordenacaoColuna === campo) { this.ordenacaoDirecao = this.ordenacaoDirecao === 'asc' ? 'desc' : 'asc'; }
        else { this.ordenacaoColuna = campo; this.ordenacaoDirecao = 'asc'; }

        var dom = this.DOM;
        dom.find('.th-sortable .sort-icon').attr('class', 'fa-solid fa-sort sort-icon').css('color', '#94a3b8');
        var thAtivo = dom.find('.th-sortable[data-campo="' + campo + '"]');
        thAtivo.find('.sort-icon').attr('class', 'fa-solid fa-sort-' + (this.ordenacaoDirecao === 'asc' ? 'up' : 'down') + ' sort-icon').css('color', '#2563eb');

        this.paginaAtual = 1;
        this.atualizarPainelCompleto();
    },

    selecionarTodosGlobal: function() {
        this.alternarModoSelecao(true);
        var chkAll = this.DOM.find('.chk-select-all');
        chkAll.prop('checked', true);
        this.toggleSelectAll({ currentTarget: chkAll[0] });
    },

    abrirModalEscolherDiagnostico: function() {
        var that = this;
        var myModal = FLUIGC.modal({
            title: 'Escolher Diagnóstico',
            content: '<style>' +
                     '#tableDiagnosticos tbody tr td { background-color: #ffffff !important; color: #4b5563 !important; border-top: 1px solid #e2e8f0 !important; vertical-align: middle !important; } ' +
                     '#tableDiagnosticos tbody tr:nth-child(even) td { background-color: #f8fafc !important; } ' +
                     '#tableDiagnosticos thead th { background-color: #f1f5f9 !important; color: #374151 !important; border-bottom: 2px solid #e2e8f0 !important; }' +
                     '</style>' +
                     '<div class="table-responsive" style="min-height: 200px;"><table id="tableDiagnosticos" class="table" style="width:100%; border-collapse: collapse;"><thead><tr><th>ID</th><th>Empresa</th><th>Contato</th><th>Email</th><th>Ação</th></tr></thead><tbody></tbody></table></div>',
            id: 'modal-diagnosticos',
            size: 'large',
            actions: [{ 'label': 'Fechar', 'autoClose': true }]
        }, function(err, data) {
            if(err) return false;
            var load = FLUIGC.loading('#modal-diagnosticos');
            load.show();
            
            $.ajax({
                url: "/process-management/api/v2/requests",
                type: "GET",
                data: { "processId": "PROCESSO_RH_DIAGNOSTICO", "expand": ["formFields"], "sort": "processInstanceId,desc", "page": 1, "pageSize": 100, "status": "ALL" },
                traditional: true, contentType: "application/json",
                success: function (response) {
                    var items = response.items || [];
                    var tbody = $('#tableDiagnosticos tbody');
                    tbody.empty();

                    var idsJaUtilizados = {};
                    that.todosOsLeadsMemoria.forEach(function(leadRow) {
                        if (leadRow.dados_extras) {
                            try {
                                var extrasRow = JSON.parse(leadRow.dados_extras);
                                if (extrasRow && extrasRow.diagnostico_id) { idsJaUtilizados[String(extrasRow.diagnostico_id)] = true; }
                            } catch(e) { }
                        }
                    });

                    var leadEmEdicao = (that.modoEdicao && that.linhaEmEdicao) ? that.linhaEmEdicao.data('lead') : null;
                    var emailDoRegistroEmEdicao = (leadEmEdicao && String(leadEmEdicao.email || '').trim() !== '') ? String(leadEmEdicao.email).trim().toLowerCase() : null;

                    items.forEach(function(item) {
                        if (item.status === "COMPLETED" || item.status === "CANCELED") return;
                        if (item.startDate) {
                            var dataProcessoDiag = moment(item.startDate).format("DD/MM/YYYY");
                            if (dataProcessoDiag === "16/06/2026") return;
                            if (dataProcessoDiag === "26/06/2026") return;
                        }
                        
                        var form = that.converteFormFields(item.formFields);
                        var empresaNome = form.empresa || form.nome_empresa || form.razao_social;
                        var contatoNome = form.nome_contato || form.nome || form.contato;
                        var contatoEmail = form.email_contato || form.email || '-';
                        
                        if (!empresaNome || empresaNome.trim() === "") return;

                        var docIdEmEdicao = (that.modoEdicao && that.linhaEmEdicao) ? that.linhaEmEdicao.data('lead').documentId : null;
                        var jaUtilizado = !!idsJaUtilizados[String(item.processInstanceId)];
                        var emailNormalizadoItem = String(contatoEmail || '').trim().toLowerCase();
                        var emailDivergeDoRegistro = !jaUtilizado && emailDoRegistroEmEdicao && emailNormalizadoItem !== emailDoRegistroEmEdicao;
                        var leadExistente = (!jaUtilizado && !emailDivergeDoRegistro) ? that.todosOsLeadsMemoria.find(function(l) {
                            var mesmoRegistro = docIdEmEdicao && l.documentId && String(l.documentId) === String(docIdEmEdicao);
                            return !mesmoRegistro && emailNormalizadoItem && String(l.email || '').trim().toLowerCase() === emailNormalizadoItem;
                        }) : null;
                        var emailJaExistente = !!leadExistente;
                        var tr = $('<tr></tr>');
                        if (jaUtilizado) { tr.css({ opacity: 0.55 }); }
                        tr.append('<td>' + item.processInstanceId + '</td><td>' + empresaNome + '</td><td>' + (contatoNome || '-') + '</td><td>' + contatoEmail + '</td>');

                        var tdAction = $('<td></td>');
                        if (jaUtilizado) {
                            tdAction.append('<span class="label" style="display:inline-block; background-color:#94a3b8; color:#fff; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:600;"><i class="fa-solid fa-ban" style="margin-right:4px;"></i>Já utilizado</span>');
                        } else if (emailDivergeDoRegistro) {
                            tdAction.append('<span class="label" title="O e-mail do registro em edição é a chave primária e não pode ser alterado." style="display:inline-block; background-color:#94a3b8; color:#fff; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:600;"><i class="fa-solid fa-ban" style="margin-right:4px;"></i>E-mail diferente do registro</span>');
                        } else if (emailJaExistente) {
                            var btnSubstituir = $('<button class="btn btn-warning btn-sm" title="Este e-mail já existe no painel. Isso atualiza os dados desse registro com as informações do diagnóstico (o e-mail, chave primária, não é alterado).">Substituir Dados</button>');
                            btnSubstituir.on('click', function() {
                                that.abrirModalEdicao($('<div></div>').data('lead', leadExistente));
                                that.preencherDadosDoDiagnostico(form, item.processInstanceId);
                                myModal.remove();
                            });
                            tdAction.append(btnSubstituir);
                        } else {
                            var btnSelect = $('<button class="btn btn-primary btn-sm">Selecionar</button>');
                            btnSelect.on('click', function() {
                                that.preencherDadosDoDiagnostico(form, item.processInstanceId);
                                myModal.remove();
                            });
                            tdAction.append(btnSelect);
                        }
                        tr.append(tdAction);
                        tbody.append(tr);
                    });
                    
                    if($.fn.DataTable) { $('#tableDiagnosticos').DataTable({ destroy: true, pageLength: 5, lengthChange: false, order: [], aaSorting: [], language: { url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json' } }); }
                    load.hide();
                },
                error: function() { load.hide(); FLUIGC.toast({ message: 'Erro ao buscar diagnósticos.', type: 'danger' }); }
            });
        });
    },

    converteFormFields: function (listaCampos) {
        var mapa = {};
        if (listaCampos && Array.isArray(listaCampos)) { listaCampos.forEach(function (item) { mapa[item.field] = item.value; }); }
        return mapa;
    },

    preencherDadosDoDiagnostico: function(form, idDiagnostico) {
        var dom = this.DOM;
        this.fonteAtualModal = 'Diagnóstico';
        this.diagnosticoIdSelecionado = idDiagnostico;

        if (idDiagnostico) this.exibirEtiquetaDiagnostico(idDiagnostico);

        var empresaNome = form.empresa || form.nome_empresa || form.razao_social;
        var contatoNome = form.nome_contato || form.nome || form.contato;
        var contatoEmail = form.email_contato || form.email;

        if (empresaNome) dom.find('.empresa-nome').val(empresaNome);
        if (form.cnpj || form.cnpj_empresa) dom.find('.empresa-cnpj').val(form.cnpj || form.cnpj_empresa);
        if (form.company_site) dom.find('.empresa-site').val(form.company_site);
        if (contatoNome) dom.find('.lead-nome').val(contatoNome);
        if (contatoEmail) dom.find('.lead-email').val(contatoEmail);
        if (form.telefone) dom.find('.lead-telefone').val(form.telefone);
        if (form.user_role) dom.find('.lead-cargo').val(form.user_role);
        if (form.linkedin || form.linkedin_contato) dom.find('.lead-linkedin').val(form.linkedin || form.linkedin_contato);

        this.verificarEmailDuplicadoNoModal();

        var faltando = [];
        if (!empresaNome) faltando.push('Empresa');
        if (!contatoNome) faltando.push('Nome do contato');
        if (!contatoEmail) faltando.push('Email');
        if (!form.telefone) faltando.push('Telefone');

        if (faltando.length > 0) {
            FLUIGC.toast({ title: 'Atenção:', message: 'Diagnóstico não trouxe os dados: ' + faltando.join(', ') + '. Preencha manualmente antes de salvar.', type: 'warning' });
        } else {
            FLUIGC.toast({ title: 'Sucesso:', message: 'Dados da empresa e contato preenchidos com sucesso!', type: 'success' });
        }
    },

    exibirEtiquetaDiagnostico: function(idDiagnostico) {
        var dom = this.DOM;
        dom.find('.diagnostico-etiqueta-texto').text('Diagnóstico Vinculado #' + idDiagnostico);
        dom.find('.diagnostico-etiqueta').css('display', 'inline-flex');
        var tenant = window.WCMAPI ? WCMAPI.getTenantCode() : '1';
        var serverUrl = window.WCMAPI ? WCMAPI.getServerURL() : '';
        var url = serverUrl + "/portal/p/" + tenant + "/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + idDiagnostico;
        dom.find('.btn-abrir-diagnostico').attr('href', url).css('display', 'inline-flex');
    },

    esconderEtiquetaDiagnostico: function() {
        this.DOM.find('.diagnostico-etiqueta').hide();
        this.DOM.find('.diagnostico-etiqueta-texto').text('Diagnóstico');
        this.DOM.find('.btn-abrir-diagnostico').hide().attr('href', '#');
    },

    alternarModoSelecao: function(ativo) {
        var dom = this.DOM;
        if (ativo) {
            dom.find('.default-actions').hide();
            dom.find('.selection-actions').css('display', 'flex');
            dom.find('.col-checkbox').show();
            this.verificarSelecao();
        } else {
            dom.find('.selection-actions').hide();
            dom.find('.default-actions').css('display', 'flex');
            dom.find('.col-checkbox').hide();
            dom.find('.chk-select-all').prop('checked', false);
            dom.find('.chk-lead-select').prop('checked', false);
            dom.find('.table-body tr').removeClass('selected-row');
        }
    },

    toggleSelectAll: function(e) {
        var isChecked = $(e.currentTarget).is(':checked');
        var checkboxes = this.DOM.find('.table-body tr.hoverable:visible .chk-lead-select');
        checkboxes.prop('checked', isChecked);
        if(isChecked) { this.DOM.find('.table-body tr.hoverable:visible').addClass('selected-row'); } 
        else { this.DOM.find('.table-body tr.hoverable:visible').removeClass('selected-row'); }
        this.verificarSelecao();
    },

    verificarSelecao: function() {
        var count = this.DOM.find('.table-body tr.selected-row:visible').length;
        var totalVisible = this.DOM.find('.table-body tr.hoverable:visible').length;
        this.DOM.find('.selected-count-text').text(count + ' lead(s) selecionado(s)');
        var btnEdit = this.DOM.find('.btn-edit-selected');
        var btnDelete = this.DOM.find('.btn-delete-selected');
        if (count === 1) { btnEdit.show(); btnDelete.show(); } 
        else if (count > 1) { btnEdit.hide(); btnDelete.show(); } 
        else { btnEdit.hide(); btnDelete.hide(); }
        
        if (totalVisible > 0 && count === totalVisible) { this.DOM.find('.chk-select-all').prop('checked', true); } 
        else { this.DOM.find('.chk-select-all').prop('checked', false); }
    },

    excluirSelecionados: function() {
        var that = this;
        var selecionados = this.DOM.find('.table-body tr.selected-row:visible');
        if (selecionados.length === 0) return;
        if (confirm('Atenção: Tem certeza que deseja apagar os ' + selecionados.length + ' leads selecionados?')) {
            that.mostrarOverlayLoading('A excluir registos...', '0 / ' + selecionados.length);
            var chamadasAjax = [];
            selecionados.each(function() {
                var trElement = $(this);
                var leadData = trElement.data('lead');
                if (leadData && leadData.documentId) {
                    var req = $.ajax({ url: "/api/public/2.0/documents/deleteDocument/" + leadData.documentId, type: "POST" });
                    chamadasAjax.push(req);
                }
            });
            $.when.apply($, chamadasAjax).always(function() {
                selecionados.each(function() {
                    var docId = $(this).data('lead').documentId;
                    that.todosOsLeadsMemoria = that.todosOsLeadsMemoria.filter(function(l) { return String(l.documentId) !== String(docId); });
                });
                that.alternarModoSelecao(false);
                that.atualizarPainelCompleto();
                that.ocultarOverlayLoading();
                FLUIGC.toast({ title: 'Concluído: ', message: 'Leads excluídos com sucesso.', type: 'success' });
            });
        }
    },

    preencherDadosTeste: function() {
        var dom = this.DOM;
        var randomNum = Math.floor(Math.random() * 9000) + 1000;
        dom.find('.lead-nome').val('Usuario de Teste ' + randomNum);
        dom.find('.lead-cargo').val('Diretor Comercial');
        dom.find('.lead-telefone').val('(11) 9' + randomNum + '-0000');
        dom.find('.lead-email').val('teste' + randomNum + '@empresa.com');
        dom.find('.lead-linkedin').val('https://linkedin.com/in/teste' + randomNum);
        dom.find('.empresa-nome').val('Empresa Mock ' + randomNum + ' Ltda');
        dom.find('.empresa-cnpj').val('00.000.000/0001-00');
        dom.find('.empresa-site').val('www.empresa' + randomNum + '.com.br');
        var origens = ['Site', 'Redes'];
        var statuses = ['Novo', 'Contato', 'Convertido'];
        dom.find('.lead-origem').val(origens[Math.floor(Math.random() * origens.length)]);
        dom.find('.lead-status').val(statuses[Math.floor(Math.random() * statuses.length)]);
    },

    inicializarGraficos: function() {
        var ctxStatus = this.DOM.find('.chart-status-funil')[0].getContext('2d');
        var ctxMetodo = this.DOM.find('.chart-metodo-leads')[0].getContext('2d');

        this.graficoStatus = new Chart(ctxStatus, {
            type: 'pie',
            data: { labels: ['Novos', 'Em Contato', 'Convertidos'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#9ca3af', '#0000CD', '#2f855a'], borderColor: '#0f172a', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        this.graficoMetodo = new Chart(ctxMetodo, {
            type: 'pie',
            data: { labels: ['Manual', 'Arquivo', 'Integração Diagnóstico'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#9ca3af', '#2f855a', '#1e40af'], borderColor: '#0f172a', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    },

    atualizarGraficos: function(novos, contato, convertido, manual, arquivo, diagnostico) {
        if(this.graficoStatus) { this.graficoStatus.data.datasets[0].data = [novos, contato, convertido]; this.graficoStatus.update(); }
        if(this.graficoMetodo) { this.graficoMetodo.data.datasets[0].data = [manual, arquivo, (diagnostico || 0)]; this.graficoMetodo.update(); }
    },

    carregarConfiguracaoFluig: function() {
        var that = this;
        try {
            $.ajax({
                type: "GET",
                url: "/api/public/ecm/dataset/search?datasetId=ds_config_painel_leads",
                success: function(data) {
                    if (data && data.content && data.content.length > 0) {
                        that.idPastaFluig = data.content[0].idPasta;
                        that.idFormularioFluig = data.content[0].idFormulario;
                        that.carregarDadosFluig();
                    } else { 
                        FLUIGC.toast({ title: 'Atenção:', message: 'Dataset de configuração não encontrado.', type: 'warning' }); 
                    }
                }
            });
        } catch(e) { console.error("Erro", e); }
    },

    carregarDadosFluig: function() {
        var that = this;

        var leadsEmCache = this.carregarCacheLeads();
        if (leadsEmCache) {
            that.todosOsLeadsMemoria = leadsEmCache;
            that.atualizarPainelCompleto();
            that.buscarRestanteBackground();
            return;
        }

        this.mostrarOverlayLoading('Carregando Leads...', 'Buscando registros iniciais...');
        
        $.ajax({
            type: "GET",
            url: "/api/public/ecm/dataset/search?datasetId=" + this.nomeDatasetLeads + "&limit=200",
            success: function(data) {
                try {
                    that.processarLoteEAtualizar(data.content || []);
                    that.ocultarOverlayLoading();
                    
                    that.buscarRestanteBackground();
                } catch(e) {
                    console.error("Erro ao processar dados", e);
                    that.ocultarOverlayLoading();
                }
            },
            error: function(err) { 
                console.error("Erro ao ler dataset de leads via API", err); 
                that.ocultarOverlayLoading();
                FLUIGC.toast({ title: 'Erro:', message: 'Falha ao sincronizar os leads com o servidor.', type: 'danger' }); 
            }
        });
    },

    carregarCacheLeads: function() {
        try {
            var bruto = window.localStorage.getItem(this.chaveCacheLeads);
            if (!bruto) return null;
            var cache = JSON.parse(bruto);
            if (!cache || !Array.isArray(cache.leads)) return null;
            return cache.leads;
        } catch(e) {
            console.error("Erro ao ler cache local dos leads", e);
            return null;
        }
    },

    salvarCacheLeads: function() {
        try {
            var payload = JSON.stringify({ leads: this.todosOsLeadsMemoria, salvoEm: Date.now() });
            window.localStorage.setItem(this.chaveCacheLeads, payload);
        } catch(e) {
            console.error("Erro ao salvar cache local dos leads", e);
        }
    },

    agendarSalvarCacheLeads: function() {
        var that = this;
        if (this.cacheLeadsDebounceTimer) { clearTimeout(this.cacheLeadsDebounceTimer); }
        this.cacheLeadsDebounceTimer = setTimeout(function() {
            that.salvarCacheLeads();
        }, 800);
    },

    processarLoteEAtualizar: function(valores) {
        var that = this;
        that.todosOsLeadsMemoria = []; 
        
        var linhasPorDocumento = {};
        var ordemDocumentos = [];
        var linhasSemDocumento = [];
        
        valores.forEach(function(row) {
            var ativo = row["metadata#active"];
            if (ativo === false || String(ativo).toLowerCase() === "false" || String(ativo) === "0") return;
            
            var documentId = row["metadata#id"] || row["documentid"] || row["id"];
            var version = parseInt(row["metadata#version"] || row["version"], 10) || 0;
            
            if (!documentId) { linhasSemDocumento.push(row); return; }
            var existente = linhasPorDocumento[String(documentId)];
            var versaoExistente = existente ? (parseInt(existente["metadata#version"] || existente["version"], 10) || 0) : -1;
            if (!existente) { ordemDocumentos.push(String(documentId)); }
            if (!existente || version >= versaoExistente) { linhasPorDocumento[String(documentId)] = row; }
        });
        
        var linhasAtuais = ordemDocumentos.map(function(documentId) { return linhasPorDocumento[documentId]; }).concat(linhasSemDocumento);
        
        linhasAtuais.forEach(function(row) {
            var extraData = {};
            if (row["dados_extras"]) { try { extraData = JSON.parse(row["dados_extras"]); } catch(e){} }
            if (row["lead_segmento"] && String(row["lead_segmento"]).trim() !== '') extraData["Segmento"] = String(row["lead_segmento"]).trim();
            if (row["lead_cidade"] && String(row["lead_cidade"]).trim() !== '') extraData["Cidade"] = String(row["lead_cidade"]).trim();
            if (row["lead_focal"] && String(row["lead_focal"]).trim() !== '') extraData["Focal"] = String(row["lead_focal"]).trim();
            
            var docIdVal = row["metadata#id"] || row["documentid"] || row["id"];
            var leadObj = {
                documentId: docIdVal,
                version: parseInt(row["metadata#version"] || row["version"], 10) || 1000,
                idContato: String(row["lead_id"] || docIdVal || "").trim(),
                nomeContato: String(row["lead_nome"] || "").trim(),
                cargo: String(row["lead_cargo"] || "").trim(),
                telefone: String(row["lead_telefone"] || "").trim(),
                email: String(row["lead_email"] || "").trim(),
                linkedin: String(row["lead_linkedin"] || "").trim(),
                nomeEmpresa: String(row["empresa_nome"] || "").trim(),
                cnpj: String(row["empresa_cnpj"] || "").trim(),
                site: String(row["empresa_site"] || "").trim(),
                origem: String(row["lead_origem"] || "Site").trim(),
                status: String(row["lead_status"] || "Novo").trim(),
                fonteInsercao: String(row["fonte_insercao"] || "Manualmente").trim(),
                dados_extras: Object.keys(extraData).length > 0 ? JSON.stringify(extraData) : ""
            };
            that.todosOsLeadsMemoria.push(leadObj);
        });
        
        that.atualizarPainelCompleto();
    },

    buscarRestanteBackground: function() {
        var that = this;
        that.mostrarBarraCarregamento();
        that.buscarTodosOsRegistrosSemTruncar(5000, 0);
    },

    // O dataset "DSleads" retorna uma linha por VERSAO de cada documento (todo o
    // historico de edicoes), nao uma linha por lead. Isso significa que o total de
    // linhas brutas cresce muito mais rapido que a quantidade de leads unicos, e um
    // "limit" fixo pode ser atingido (truncando o restante dos registros) mesmo que a
    // quantidade real de leads seja pequena. Por isso, se a resposta vier com
    // exatamente o "limit" pedido, ainda pode haver mais linhas cortadas: dobramos o
    // limite e buscamos de novo, ate a resposta vir menor que o pedido (prova de que
    // veio tudo) ou atingirmos um teto de seguranca.
    buscarTodosOsRegistrosSemTruncar: function(limiteAtual, tentativa) {
        var that = this;
        var MAX_TENTATIVAS = 6;

        $.ajax({
            type: "GET",
            url: "/api/public/ecm/dataset/search?datasetId=" + this.nomeDatasetLeads + "&limit=" + limiteAtual,
            success: function(data) {
                var valores = data.content || [];

                if (valores.length >= limiteAtual && tentativa < MAX_TENTATIVAS) {
                    that.buscarTodosOsRegistrosSemTruncar(limiteAtual * 2, tentativa + 1);
                    return;
                }

                that.processarRestanteRecebido(valores);
            },
            error: function(err) {
                that.ocultarBarraCarregamento();
                console.error("Erro no carregamento background", err);
            }
        });
    },

    processarRestanteRecebido: function(valores) {
        var that = this;
        var total = valores.length;

        if (total === 0) {
            that.ocultarBarraCarregamento();
            return;
        }

        var linhasPorDocumento = {};
        var ordemDocumentos = [];
        var linhasSemDocumento = [];

        valores.forEach(function(row) {
            var ativo = row["metadata#active"];
            if (ativo === false || String(ativo).toLowerCase() === "false" || String(ativo) === "0") return;
            var documentId = row["metadata#id"] || row["documentid"] || row["id"];
            var version = parseInt(row["metadata#version"] || row["version"], 10) || 0;

            if (!documentId) { linhasSemDocumento.push(row); return; }
            var existente = linhasPorDocumento[String(documentId)];
            var versaoExistente = existente ? (parseInt(existente["metadata#version"] || existente["version"], 10) || 0) : -1;
            if (!existente) { ordemDocumentos.push(String(documentId)); }
            if (!existente || version >= versaoExistente) { linhasPorDocumento[String(documentId)] = row; }
        });

        var linhasAtuais = ordemDocumentos.map(function(documentId) { return linhasPorDocumento[documentId]; }).concat(linhasSemDocumento);

        that.todosOsLeadsMemoria = [];
        that.processarEmLotes(linhasAtuais, 0, 500);
    },

    processarEmLotes: function(linhas, index, tamanhoLote) {
        var that = this;
        var total = linhas.length;

        var ORCAMENTO_TEMPO_MS = 20;
        var VERIFICAR_TEMPO_A_CADA = 100;
        var inicioFatia = (window.performance && performance.now) ? performance.now() : Date.now();
        var i = index;

        while (i < total) {
            var row = linhas[i];
            var extraData = {};
            if (row["dados_extras"]) { try { extraData = JSON.parse(row["dados_extras"]); } catch(e){} }
            if (row["lead_segmento"] && String(row["lead_segmento"]).trim() !== '') extraData["Segmento"] = String(row["lead_segmento"]).trim();
            if (row["lead_cidade"] && String(row["lead_cidade"]).trim() !== '') extraData["Cidade"] = String(row["lead_cidade"]).trim();
            if (row["lead_focal"] && String(row["lead_focal"]).trim() !== '') extraData["Focal"] = String(row["lead_focal"]).trim();
            
            var docIdVal = row["metadata#id"] || row["documentid"] || row["id"];
            var leadObj = {
                documentId: docIdVal,
                version: parseInt(row["metadata#version"] || row["version"], 10) || 1000,
                idContato: String(row["lead_id"] || docIdVal || "").trim(),
                nomeContato: String(row["lead_nome"] || "").trim(),
                cargo: String(row["lead_cargo"] || "").trim(),
                telefone: String(row["lead_telefone"] || "").trim(),
                email: String(row["lead_email"] || "").trim(),
                linkedin: String(row["lead_linkedin"] || "").trim(),
                nomeEmpresa: String(row["empresa_nome"] || "").trim(),
                cnpj: String(row["empresa_cnpj"] || "").trim(),
                site: String(row["empresa_site"] || "").trim(),
                origem: String(row["lead_origem"] || "Site").trim(),
                status: String(row["lead_status"] || "Novo").trim(),
                fonteInsercao: String(row["fonte_insercao"] || "Manualmente").trim(),
                dados_extras: Object.keys(extraData).length > 0 ? JSON.stringify(extraData) : ""
            };
            that.todosOsLeadsMemoria.push(leadObj);
            i++;

            if ((i - index) % VERIFICAR_TEMPO_A_CADA === 0) {
                var agora = (window.performance && performance.now) ? performance.now() : Date.now();
                if ((agora - inicioFatia) >= ORCAMENTO_TEMPO_MS) { break; }
            }
        }
        
        var porcentagem = Math.round((i / total) * 100);
        that.atualizarBarraCarregamento(porcentagem, i, total);
        
        if (i < total) {
            setTimeout(function() {
                that.processarEmLotes(linhas, i, tamanhoLote);
            }, 0);
        } else {
            setTimeout(function() {
                that.ocultarBarraCarregamento();
                that.atualizarPainelCompleto();
            }, 200);
        }
    },

    mostrarBarraCarregamento: function() {
        if ($('#painel-leads-progress-bar').length === 0) {
            var html = '<div id="painel-leads-progress-bar" style="position: fixed; bottom: 20px; right: 20px; width: 320px; background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); padding: 15px; z-index: 9999; border: 1px solid #e2e8f0;">' +
                       '<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #1f2937;">' +
                       '<span>Sincronizando Registros...</span><span id="painel-leads-progress-text" style="color: #3b82f6;">0%</span></div>' +
                       '<div style="width: 100%; background-color: #e5e7eb; border-radius: 9999px; height: 16px; overflow: hidden; position: relative;">' +
                       '<div id="painel-leads-progress-fill" style="background-color: #3b82f6; height: 100%; width: 0%; transition: width 0.1s ease; display: flex; align-items: center; justify-content: center;">' +
                       '<span id="painel-leads-progress-inner-text" style="color: white; font-size: 10px; font-weight: bold; white-space: nowrap; display: none;">0%</span>' +
                       '</div>' +
                       '</div>' +
                       '<div id="painel-leads-progress-count" style="font-size: 11px; color: #6b7280; margin-top: 6px; text-align: right;">Calculando...</div>' +
                       '</div>';
            $('body').append(html);
        } else {
            $('#painel-leads-progress-bar').show();
            $('#painel-leads-progress-fill').css('width', '0%');
            $('#painel-leads-progress-text').text('0%');
            $('#painel-leads-progress-inner-text').text('0%').hide();
            $('#painel-leads-progress-count').text('Calculando...');
        }
    },

    atualizarBarraCarregamento: function(porcentagem, atual, total) {
        $('#painel-leads-progress-fill').css('width', porcentagem + '%');
        $('#painel-leads-progress-text').text(porcentagem + '%');
        
        if (porcentagem > 5) {
            $('#painel-leads-progress-inner-text').text(porcentagem + '%').show();
        } else {
            $('#painel-leads-progress-inner-text').hide();
        }
        
        $('#painel-leads-progress-count').text(atual + ' de ' + total + ' registros carregados');
    },

    ocultarBarraCarregamento: function() {
        $('#painel-leads-progress-bar').fadeOut(300);
    },

    sincronizarDados: function() {
        this.paginaAtual = 1;
        this.carregarDadosFluig();
    },

    // =======================================================================================
    // DEMAIS FUNÇÕES DO WIDGET
    // =======================================================================================

    emailJaCadastrado: function(email, docIdAtual) {
        var emailNormalizado = String(email || '').trim().toLowerCase();
        if (!emailNormalizado) return false;

        var duplicado = false;
        this.todosOsLeadsMemoria.forEach(function(lead) {
            var emailLinha = String(lead.email || '').trim().toLowerCase();
            if (!emailLinha) return;
            var mesmoRegistro = docIdAtual && lead.documentId && String(lead.documentId) === String(docIdAtual);
            if (!mesmoRegistro && emailLinha === emailNormalizado) { duplicado = true; }
        });
        return duplicado;
    },

    verificarEmailDuplicadoNoModal: function() {
        var dom = this.DOM;
        var docIdAtual = (this.modoEdicao && this.linhaEmEdicao) ? this.linhaEmEdicao.data('lead').documentId : null;
        var email = dom.find('.lead-email').val();
        var duplicado = this.emailJaCadastrado(email, docIdAtual);
        dom.find('.alerta-email-cadastrado').css('display', duplicado ? 'flex' : 'none');
        return duplicado;
    },

    // Gera o proximo ID de contato sem nunca reutilizar um numero ja usado antes,
    // mesmo que o lead que tinha o maior ID tenha sido excluido. O maior ID ja
    // emitido fica guardado no localStorage e so cresce, nunca retrocede.
    obterProximoIdContato: function() {
        var maiorId = 0;
        this.todosOsLeadsMemoria.forEach(function(l) {
            if (l && l.idContato) {
                var isFallback = (String(l.idContato) === String(l.documentId));
                if (!isFallback) {
                    var numStr = String(l.idContato).replace(/\D/g, '');
                    if (numStr) {
                        var num = parseInt(numStr, 10);
                        if (num > maiorId) maiorId = num;
                    }
                }
            }
        });

        try {
            var salvo = parseInt(window.localStorage.getItem(this.chaveContadorIdLead), 10);
            if (!isNaN(salvo) && salvo > maiorId) { maiorId = salvo; }
        } catch(e) { }

        var proximoId = maiorId + 1;
        try { window.localStorage.setItem(this.chaveContadorIdLead, String(proximoId)); } catch(e) { }
        return String(proximoId);
    },

    salvarLead: function() {
        var dom = this.DOM;
        var leadAnterior = this.modoEdicao ? this.linhaEmEdicao.data('lead') : null;
        var docIdAnterior = leadAnterior ? leadAnterior.documentId : null;

        var nomeInformado = (dom.find('.lead-nome').val() || '').trim();
        var empresaInformada = (dom.find('.empresa-nome').val() || '').trim();
        var emailInformado = (dom.find('.lead-email').val() || '').trim();

        if (!nomeInformado || !empresaInformada || !emailInformado) {
            FLUIGC.toast({ title: 'Atenção: ', message: 'Preencha os campos obrigatórios: Nome, Empresa e Email.', type: 'danger' });
            return;
        }

        if (this.verificarEmailDuplicadoNoModal()) {
            FLUIGC.toast({ title: 'Atenção: ', message: 'Este e-mail já foi cadastrado.', type: 'danger' });
            return;
        }
        
        var extraFields = {};
        dom.find('.extra-fields-content .extra-field-input').each(function() {
            var key = $(this).data('key');
            if (key) { extraFields[key] = $(this).val(); }
        });

        if (this.diagnosticoIdSelecionado) { extraFields['diagnostico_id'] = String(this.diagnosticoIdSelecionado); }
        extraFields['tipo_registro'] = dom.find('.lead-tipo-registro:checked').val() === 'Parceiro' ? 'Parceiro' : 'Cliente';

        var idContatoValor = dom.find('.lead-id').val();
        if (idContatoValor === 'Automático' || !idContatoValor) {
            idContatoValor = this.obterProximoIdContato();
        }

        var leadObj = {
            documentId: docIdAnterior,
            version: leadAnterior ? leadAnterior.version : 1000,
            idContato: idContatoValor,
            nomeContato: dom.find('.lead-nome').val(),
            cargo: dom.find('.lead-cargo').val(),
            email: dom.find('.lead-email').val(),
            telefone: dom.find('.lead-telefone').val(),
            linkedin: dom.find('.lead-linkedin').val(),
            nomeEmpresa: dom.find('.empresa-nome').val(),
            cnpj: dom.find('.empresa-cnpj').val(),
            site: dom.find('.empresa-site').val(),
            origem: dom.find('.lead-origem').val(),
            status: dom.find('.lead-status').val(),
            fonteInsercao: this.diagnosticoIdSelecionado ? 'Diagnóstico' : (leadAnterior ? leadAnterior.fonteInsercao : (this.fonteAtualModal || 'Manualmente')),
            dados_extras: Object.keys(extraFields).length > 0 ? JSON.stringify(extraFields) : ""
        };
        this.salvarAPI_Fluig(leadObj);
    },

    salvarAPI_Fluig: function(leadObj) {
        var that = this;
        var isEdit = this.modoEdicao && leadObj.documentId;
        var idAntigo = parseInt(leadObj.documentId, 10);
        
        var camposDoFormulario = [
            { "name": "lead_id", "value": leadObj.idContato || "" }, { "name": "lead_nome", "value": leadObj.nomeContato || "" },
            { "name": "lead_cargo", "value": leadObj.cargo || "" }, { "name": "lead_telefone", "value": leadObj.telefone || "" },
            { "name": "lead_email", "value": leadObj.email || "" }, { "name": "lead_linkedin", "value": leadObj.linkedin || "" },
            { "name": "empresa_nome", "value": leadObj.nomeEmpresa || "" }, { "name": "empresa_cnpj", "value": leadObj.cnpj || "" },
            { "name": "empresa_site", "value": leadObj.site || "" }, { "name": "lead_origem", "value": leadObj.origem || "" },
            { "name": "lead_status", "value": leadObj.status || "" }, { "name": "lead_segmento", "value": "" }, 
            { "name": "lead_cidade", "value": "" }, { "name": "lead_focal", "value": "" }, 
            { "name": "fonte_insercao", "value": leadObj.fonteInsercao || "" },
            { "name": "dados_extras", "value": leadObj.dados_extras || "" }
        ];
        
        if (isEdit) {
            if (!Number.isInteger(idAntigo) || idAntigo <= 0) return;
            that.mostrarOverlayLoading('Atualizando...', 'Comunicando via API SOAP...');
            var companyId = typeof WCMAPI !== 'undefined' ? WCMAPI.organizationId : 1;
            var xmlBody = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.dm.ecm.technology.totvs.com/">' +
                '<soapenv:Header/><soapenv:Body><ws:updateCardData><companyId>' + companyId + '</companyId><username></username><password></password><cardId>' + idAntigo + '</cardId><cardData>';
            camposDoFormulario.forEach(function(campo) {
                var valEscapado = String(campo.value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                xmlBody += '<item><field>' + campo.name + '</field><value>' + valEscapado + '</value></item>';
            });
            xmlBody += '</cardData></ws:updateCardData></soapenv:Body></soapenv:Envelope>';
            $.ajax({
                url: "/webdesk/ECMCardService", type: "POST", dataType: "xml", contentType: "text/xml; charset=utf-8", data: xmlBody,
                success: function() {
                    var index = that.todosOsLeadsMemoria.findIndex(function(l) { return String(l.documentId) === String(idAntigo); });
                    if (index !== -1) { that.todosOsLeadsMemoria[index] = leadObj; }
                    
                    that.fecharModal();
                    that.alternarModoSelecao(false);
                    that.atualizarPainelCompleto();
                    that.ocultarOverlayLoading();
                    FLUIGC.toast({ title: 'Sucesso: ', message: 'Registro atualizado com sucesso!', type: 'success' });
                },
                error: function(err) { that.ocultarOverlayLoading(); FLUIGC.toast({ title: 'Erro:', message: 'Falha na comunicação com servidor.', type: 'danger' }); }
            });
        } else {
            var payloadCriacao = { "documentDescription": leadObj.nomeContato + " - " + leadObj.nomeEmpresa, "version": 1000, "parentDocumentId": parseInt(this.idFormularioFluig, 10), "formData": camposDoFormulario };
            $.ajax({
                url: "/api/public/2.0/cards/create", type: "POST", contentType: "application/json", data: JSON.stringify(payloadCriacao),
                success: function(data) {
                    var dadosExtraidos = data.content ? data.content : data;
                    if (dadosExtraidos.documentId) { leadObj.documentId = dadosExtraidos.documentId; }
                    if (dadosExtraidos.version) { leadObj.version = dadosExtraidos.version; }
                    
                    that.todosOsLeadsMemoria.push(leadObj);
                    that.fecharModal();
                    that.alternarModoSelecao(false);
                    that.atualizarPainelCompleto();
                    FLUIGC.toast({ title: 'Sucesso: ', message: 'Novo lead salvo.', type: 'success' });
                },
                error: function(err) { FLUIGC.toast({ title: 'Erro: ', message: 'Falha ao salvar no servidor.', type: 'danger' }); }
            });
        }
    },

    setTipoRegistroSelecionado: function(valor) {
        var dom = this.DOM;
        var valorFinal = (valor === 'Parceiro') ? 'Parceiro' : 'Cliente';
        dom.find('.lead-tipo-registro').prop('checked', false);
        var radioAtivo = dom.find('.lead-tipo-registro[value="' + valorFinal + '"]').prop('checked', true);
        dom.find('.tipo-registro-option').removeClass('selecionado');
        radioAtivo.closest('.tipo-registro-option').addClass('selecionado');
    },

    obterTipoRegistroLead: function(lead) {
        if (!lead || !lead.dados_extras) return 'Cliente';
        try {
            var extras = JSON.parse(lead.dados_extras);
            return extras.tipo_registro === 'Parceiro' ? 'Parceiro' : 'Cliente';
        } catch(e) { return 'Cliente'; }
    },

    abrirModalNovo: function() {
        this.modoEdicao = false; this.linhaEmEdicao = null; this.fonteAtualModal = 'Manualmente'; this.diagnosticoIdSelecionado = null;
        this.DOM.find('.form-add-lead')[0].reset();
        this.DOM.find('.extra-fields-container').hide().find('.extra-fields-content').empty();
        this.DOM.find('.alerta-email-cadastrado').hide();
        this.esconderEtiquetaDiagnostico();
        this.setTipoRegistroSelecionado('Cliente');
        this.DOM.find('.lead-id').val('Automático');
        this.DOM.find('.modal-title-text').text('Novo Lead');
        this.DOM.find('.btn-submit-modal').text('Salvar Novo');
        this.DOM.find('.btn-delete-lead-modal').hide();
        this.DOM.find('.modal-overlay').removeClass('hidden');
    },

    abrirModalEdicao: function(trElement) {
        this.modoEdicao = true; this.linhaEmEdicao = trElement;
        var leadData = this.linhaEmEdicao.data('lead');
        var dom = this.DOM;

        var extraContainer = dom.find('.extra-fields-container');
        var extraContent = extraContainer.find('.extra-fields-content');
        extraContent.empty(); extraContainer.hide();
        dom.find('.alerta-email-cadastrado').hide();

        this.diagnosticoIdSelecionado = null;
        this.esconderEtiquetaDiagnostico();
        this.setTipoRegistroSelecionado(this.obterTipoRegistroLead(leadData));

        dom.find('.lead-id').val(leadData.idContato); dom.find('.lead-nome').val(leadData.nomeContato);
        dom.find('.lead-cargo').val(leadData.cargo); dom.find('.lead-telefone').val(leadData.telefone);
        dom.find('.lead-email').val(leadData.email); dom.find('.lead-linkedin').val(leadData.linkedin);
        dom.find('.empresa-nome').val(leadData.nomeEmpresa); dom.find('.empresa-cnpj').val(leadData.cnpj);
        dom.find('.empresa-site').val(leadData.site); dom.find('.lead-origem').val(leadData.origem);
        dom.find('.lead-status').val(leadData.status);

        if (leadData.dados_extras && leadData.dados_extras.trim() !== '' && leadData.dados_extras.trim() !== '{}') {
            try {
                var extrasObj = JSON.parse(leadData.dados_extras);
                var hasExtras = false;
                for (var key in extrasObj) {
                    if (extrasObj.hasOwnProperty(key)) {
                        if (key.toLowerCase() === 'diagnostico_id') {
                            this.diagnosticoIdSelecionado = extrasObj[key];
                            this.exibirEtiquetaDiagnostico(extrasObj[key]);
                            continue;
                        }
                        if (key.toLowerCase() === 'diagnosticos_substituidos') { continue; }
                        if (key.toLowerCase() === 'tipo_registro') { continue; }
                        hasExtras = true;
                        var fieldId = 'extra_field_' + key.replace(/[^a-zA-Z0-9]/g, '_');
                        var labelNome = key.charAt(0).toUpperCase() + key.slice(1);
                        var fieldHtml = '<div style="margin-bottom: 10px;"><label for="' + fieldId + '" style="display: block; font-size: 13px; font-weight: 600; color: #4b5563; margin-bottom: 4px;">' + labelNome + '</label><input type="text" id="' + fieldId + '" class="extra-field-input" data-key="' + key + '" value="' + (extrasObj[key] || '') + '" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px;"></div>';
                        extraContent.append(fieldHtml);
                    }
                }
                if (hasExtras) { extraContainer.show(); }
            } catch(e) { }
        }

        dom.find('.modal-title-text').text('Editar Lead');
        dom.find('.btn-submit-modal').text('Atualizar Registro');
        dom.find('.btn-delete-lead-modal').css('display', 'flex');
        dom.find('.modal-overlay').removeClass('hidden');
    },

    fecharModal: function() {
        this.fonteAtualModal = 'Manualmente'; this.diagnosticoIdSelecionado = null;
        this.DOM.find('.modal-overlay').addClass('hidden');
        this.DOM.find('.form-add-lead')[0].reset();
        this.DOM.find('.extra-fields-container').hide().find('.extra-fields-content').empty();
        this.DOM.find('.btn-delete-lead-modal').hide();
        this.esconderEtiquetaDiagnostico();
    },

    excluirLeadDoModal: function() {
        var that = this;
        if (!this.modoEdicao || !this.linhaEmEdicao) return;
        var leadData = this.linhaEmEdicao.data('lead');
        if (!leadData || !leadData.documentId) return;

        if (!confirm('Atenção: Tem certeza que deseja apagar este lead?')) return;

        that.mostrarOverlayLoading('A excluir registro...', '');
        $.ajax({ url: "/api/public/2.0/documents/deleteDocument/" + leadData.documentId, type: "POST" }).always(function() {
            that.todosOsLeadsMemoria = that.todosOsLeadsMemoria.filter(function(l) { return String(l.documentId) !== String(leadData.documentId); });
            that.fecharModal();
            that.alternarModoSelecao(false);
            that.atualizarPainelCompleto();
            that.ocultarOverlayLoading();
            FLUIGC.toast({ title: 'Concluído: ', message: 'Lead excluído com sucesso.', type: 'success' });
        });
    },

    adicionarNovaLinha: function(leadObj, carregamentoLote, skipAppend) {
        if (!carregamentoLote) this.DOM.find('.table-empty-row').hide();
        var isSelectionMode = this.DOM.find('.selection-actions').is(':visible');
        var checkboxStyle = isSelectionMode ? '' : 'display: none;';
        if (leadObj.fonteInsercao !== this.ultimaFonteInserida) { this.ultimaFonteInserida = leadObj.fonteInsercao; }
        var tr = $('<tr class="hoverable"></tr>');
        this.renderizarConteudoLinha(tr, leadObj, checkboxStyle);
        if (!skipAppend) { this.DOM.find('.table-body').append(tr); }
        return tr;
    },

    renderizarConteudoLinha: function(tr, lead, checkboxStyle) {
        tr.data('lead', lead);
        tr.attr('title', 'Duplo clique para editar');
        tr.attr('data-origem', (lead.origem || '').toLowerCase());
        tr.attr('data-status', (lead.status || '').toLowerCase());
        tr.attr('data-fonte', lead.fonteInsercao === 'Manualmente' ? 'manual' : (lead.fonteInsercao === 'Diagnóstico' ? 'diagnostico' : 'arquivo'));

        if (checkboxStyle === undefined) {
            var isSelectionMode = this.DOM.find('.selection-actions').is(':visible');
            checkboxStyle = isSelectionMode ? '' : 'display: none;';
        }
        var txtPreencher = '<span style="color: #9ca3af; font-style: italic;">Preencher</span>';
        var siteLimpo = String(lead.site || '').trim();
        var linkedinLimpo = String(lead.linkedin || '').trim();
        var idLimpo = String(lead.idContato || '').trim();
        var isValid = function(val) { return val && String(val).trim() !== '' && String(val).trim() !== '-'; };
        
        var displayId = isValid(idLimpo) ? (idLimpo.startsWith('#') ? idLimpo : '#' + idLimpo) : txtPreencher;
        var displayNome = isValid(lead.nomeContato) ? lead.nomeContato : txtPreencher;
        var displayCargo = isValid(lead.cargo) ? lead.cargo : txtPreencher;
        var displayEmpresa = isValid(lead.nomeEmpresa) ? lead.nomeEmpresa : txtPreencher;
        var displayEmail = isValid(lead.email) ? lead.email : txtPreencher;
        var displayTelefone = isValid(lead.telefone) ? lead.telefone : txtPreencher;
        var displaySite = isValid(siteLimpo) ? '<a href="' + (siteLimpo.startsWith('http') ? siteLimpo : 'https://' + siteLimpo) + '" target="_blank" style="color: #2563eb; text-decoration: underline; max-width: 140px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + siteLimpo + '">' + siteLimpo.replace(/^https?:\/\//, '').replace(/^www\./, '') + '</a>' : txtPreencher;
        var displayLinkedin = isValid(linkedinLimpo) ? '<a href="' + (linkedinLimpo.startsWith('http') ? linkedinLimpo : 'https://' + linkedinLimpo) + '" target="_blank" style="color: #0a66c2; margin-left: 8px; font-size: 16px; text-decoration: none;" title="Abrir LinkedIn"><i class="fa-brands fa-linkedin"></i></a>' : '<span style="color: #9ca3af; font-style: italic; margin-left: 8px; font-size: 12px; font-weight: normal; display: inline-flex; align-items: center; gap: 4px;" title="LinkedIn não preenchido"><i class="fa-brands fa-linkedin" style="color: #cbd5e1; font-size: 14px;"></i> Preencher</span>';
            
        var visualCargo = '<div style="font-size: 12px; color: #6b7280; font-weight: normal; margin-top: 4px;"><i class="fa-solid fa-briefcase" style="font-size: 11px; margin-right: 4px;"></i>' + displayCargo + '</div>';
        var infoCnpj = isValid(lead.cnpj) ? '<div style="font-size: 11px; color: #6b7280; margin-top: 2px; margin-left: 16px;"><i class="fa-solid fa-id-card" style="font-size: 10px; margin-right: 4px; color: #9ca3af;"></i>CNPJ: ' + lead.cnpj + '</div>' : '<div style="font-size: 11px; color: #9ca3af; font-style: italic; margin-top: 2px; margin-left: 16px;">CNPJ: Preencher</div>';
        var visualEmpresa = '<div style="font-size: 15px; color: #111827; font-weight: 700; margin-top: 0px;"><i class="fa-regular fa-building" style="font-size: 12px; margin-right: 4px; color: #d97706;"></i>' + displayEmpresa + '</div>' + infoCnpj;
        
        var isManual = lead.fonteInsercao === 'Manualmente';
        var isDiag = lead.fonteInsercao === 'Diagnóstico';
        var isArquivo = !isManual && !isDiag;

        var iconFnt = isDiag ? '<i class="fa-solid fa-stethoscope" style="color: #1e40af;"></i>' : isManual ? '<i class="fa-solid fa-user-pen" style="color: #6b7280;"></i>' : '<i class="fa-solid fa-file-csv" style="color: #10b981;"></i>';
        var corFundo = isDiag ? '#eff6ff' : (isArquivo ? '#ecfdf5' : '#f3f4f6');
        var corBorda = isDiag ? '#bfdbfe' : (isArquivo ? '#a7f3d0' : '#e5e7eb');
        var corTexto = isDiag ? '#1e40af' : (isArquivo ? '#065f46' : '#6b7280');

        var idDiagNaLinha = '';
        var linkDiagnostico = '';
        if (isDiag && lead.dados_extras) {
            try {
                var extrasFonte = JSON.parse(lead.dados_extras);
                if (extrasFonte && extrasFonte.diagnostico_id) {
                    idDiagNaLinha = ' #' + extrasFonte.diagnostico_id;
                    var tenant = window.WCMAPI ? WCMAPI.getTenantCode() : '1';
                    var serverUrl = window.WCMAPI ? WCMAPI.getServerURL() : '';
                    var url = serverUrl + "/portal/p/" + tenant + "/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + extrasFonte.diagnostico_id;
                    linkDiagnostico = '<a href="' + url + '" target="_blank" style="margin-left: 10px; font-size: 12px; color: #2563eb; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor=\'#eff6ff\'" onmouseout="this.style.backgroundColor=\'transparent\'"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Formulário</a>';
                }
            } catch(e) { }
        }

        var visualFonte = '<div style="margin-top: 8px; display: flex; align-items: center;"><div style="font-size: 11px; color: ' + corTexto + '; display: inline-flex; align-items: center; background-color: ' + corFundo + '; border: 1px solid ' + corBorda + '; padding: 2px 8px; border-radius: 12px; font-weight: 500; gap: 6px;">' + iconFnt + ' ' + lead.fonteInsercao + idDiagNaLinha + '</div>' + linkDiagnostico + '</div>';
        var tipoRegistroLead = this.obterTipoRegistroLead(lead);
        var visualTipoRegistro = tipoRegistroLead === 'Parceiro'
            ? '<div style="font-size: 11px; color: #065f46; display: inline-flex; align-items: center; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 12px; font-weight: 500; gap: 6px; white-space: nowrap;"><i class="fa-solid fa-handshake"></i> Parceiro</div>'
            : '<div style="font-size: 11px; color: #111827; display: inline-flex; align-items: center; background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 12px; font-weight: 500; gap: 6px; white-space: nowrap;"><i class="fa-solid fa-user"></i> Cliente</div>';

        var visualExtras = "";
        if (lead.dados_extras && lead.dados_extras !== "") {
            try {
                var extrasObj = JSON.parse(lead.dados_extras);
                for (var chave in extrasObj) {
                    if (extrasObj.hasOwnProperty(chave) && chave.toLowerCase() !== 'diagnostico_id' && chave.toLowerCase() !== 'diagnosticos_substituidos') {
                        visualExtras += '<div style="font-size: 11px; color: #9ca3af; margin-top: 3px; margin-left: 16px;"><span style="font-weight: 500; color: #6b7280;">' + chave.charAt(0).toUpperCase() + chave.slice(1) + ':</span> ' + extrasObj[chave] + '</div>';
                    }
                }
            } catch (e) { }
        }
        
        tr.html(
            '<td class="col-checkbox" style="' + checkboxStyle + ' vertical-align: middle; text-align: center; width: 45px;"><input type="checkbox" class="chk-lead-select" style="cursor:pointer; width: 15px; height: 15px;"></td>' +
            '<td style="vertical-align: top; padding-top: 16px; font-weight: 500;">' + displayId + '</td>' +
            '<td style="vertical-align: middle; text-align: center; width: 110px;" title="Tipo de Registro: ' + tipoRegistroLead + '">' + visualTipoRegistro + '</td>' +
            '<td style="vertical-align: top; padding-top: 14px; width: 25%;">' + visualEmpresa + '<div class="font-bold-name" style="display: flex; align-items: center; font-size: 13px; margin-top: 6px; font-weight: 400; color: #6b7280;">' + displayNome + displayLinkedin + '</div>' + visualCargo + visualExtras + visualFonte + '</td>' +
            '<td style="vertical-align: top; padding-top: 16px;">' + displayEmail + '</td>' +
            '<td style="vertical-align: top; padding-top: 16px;">' + displayTelefone + '</td>' +
            '<td style="vertical-align: top; padding-top: 16px;">' + displaySite + '</td>'
        );
    },

    mostrarOverlayLoading: function(titulo, subtexto, pct) {
        if ($('#fluig-import-overlay').length === 0) {
            $('body').append(
                '<div id="fluig-import-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(17, 24, 39, 0.85); z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:sans-serif; backdrop-filter: blur(3px);">' +
                '<div style="border:6px solid rgba(255,255,255,0.2); border-top:6px solid #3b82f6; border-radius:50%; width:60px; height:60px; animation:spin 1s linear infinite;"></div>' +
                '<h2 id="fluig-import-title" style="margin-top:24px; font-size: 22px; font-weight: 600;">' + titulo + '</h2>' +
                '<p id="fluig-import-progress" style="font-size:18px; margin-top: 10px; color: #93c5fd; font-weight: bold;">' + subtexto + '</p>' +
                '<div id="fluig-import-progress-bar-container" style="display:none; width: 300px; margin-top: 15px; background-color: rgba(255,255,255,0.2); border-radius: 10px; height: 16px; overflow: hidden; position: relative;">' +
                '<div id="fluig-import-progress-bar-fill" style="background-color: #3b82f6; height: 100%; width: 0%; transition: width 0.1s ease; display:flex; align-items:center; justify-content:center;">' +
                '<span id="fluig-import-progress-pct-inner" style="font-size: 11px; font-weight: bold; color: white; display:none; white-space: nowrap;">0%</span>' +
                '</div>' +
                '</div>' +
                '<style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>' +
                '</div>'
            );
        } else {
            $('#fluig-import-title').text(titulo); 
            $('#fluig-import-progress').text(subtexto); 
            $('#fluig-import-overlay').css('display', 'flex');
        }

        if (pct !== undefined && pct !== null) {
            $('#fluig-import-progress-bar-container').show();
            $('#fluig-import-progress-bar-fill').css('width', pct + '%');
            if (pct > 5) { 
                $('#fluig-import-progress-pct-inner').text(pct + '%').show(); 
            } else { 
                $('#fluig-import-progress-pct-inner').hide(); 
            }
        } else {
            $('#fluig-import-progress-bar-container').hide();
        }
    },

    ocultarOverlayLoading: function() { $('#fluig-import-overlay').hide(); },
    
    abrirSeletorArquivo: function() { this.DOM.find('.file-input').click(); },

    processarArquivo: function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var nomeDoArquivo = file.name;

        var arquivoJaImportado = this.todosOsLeadsMemoria.some(function(lead) {
            return lead.fonteInsercao === nomeDoArquivo;
        });

        if (arquivoJaImportado) {
            FLUIGC.toast({ title: 'Aviso:', message: 'A planilha "' + nomeDoArquivo + '" já foi importada anteriormente.', type: 'warning' });
            $(e.target).val(''); 
            return; 
        }

        var reader = new FileReader();
        var that = this;
        that.mostrarOverlayLoading('A analisar ficheiro...', 'Lendo colunas da planilha...');
        reader.onload = function(evt) {
            try {
                var data; var workbook;
                try { data = new Uint8Array(evt.target.result); workbook = XLSX.read(data, {type: 'array'}); } 
                catch (errBinary) { data = evt.target.result; workbook = XLSX.read(data, {type: 'binary'}); }
                var jsonDaPlanilha = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1});
                if (jsonDaPlanilha.length < 1) { that.ocultarOverlayLoading(); FLUIGC.toast({ title: 'Erro', message: 'O ficheiro parece estar vazio.', type: 'danger' }); return; }
                
                var mapColunas = { id: -1, nome: -1, cargo: -1, email: -1, telefone: -1, linkedin: -1, empresa: -1, cnpj: -1, site: -1, origem: -1, status: -1, segmento: -1, cidade: -1, focal: -1 };
                var keywords = { id: ['id', 'código', 'codigo', 'chave'], cnpj: ['cnpj', 'documento', 'doc', 'num. doc'], empresa: ['empresa', 'conta', 'razão', 'razao', 'cliente', 'companhia', 'organization', 'company'], nome: ['nome', 'contato', 'lead', 'pessoa', 'name'], email: ['email', 'e-mail', 'mail', 'correio', '@'], telefone: ['telefone', 'celular', 'whatsapp', 'tel', 'cel', 'fone', 'phone', 'mobile'], cargo: ['cargo', 'função', 'funcao', 'posição', 'position', 'title', 'cargo/função'], linkedin: ['linkedin', 'rede social', 'perfil linkedin'], site: ['site', 'web', 'url', 'website', 'domínio', 'dominio', 'website/url'], origem: ['origem', 'source', 'canal', 'fonte'], status: ['status', 'situação', 'situacao', 'fase', 'etapa', 'status lead'], segmento: ['segmento', 'segment', 'ramo', 'indústria', 'industria', 'setor'], cidade: ['cidade', 'city', 'localidade', 'município', 'municipio', 'local'], focal: ['focal', 'responsável', 'responsabilidade', 'gerente', 'coordenador', 'supervisor'] };
                var normalizarTexto = function(valor) { return String(valor || '').toLowerCase().trim(); };
                var pareceValorDeDado = function(valor) {
                    var txt = normalizarTexto(valor);
                    if (!txt) return false;
                    var numeros = txt.replace(/\D/g, '');
                    return (txt.includes('@') && txt.includes('.')) || txt.includes('http') || txt.includes('www.') || numeros.length >= 8 || /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(txt);
                };
                var cabecalhoBateComKeywords = function(cabecalho, keys) {
                    return keys.some(function(k) {
                        if (k === '@') return cabecalho === '@';
                        if (keys.includes(cabecalho)) return true;
                        if (k.length <= 3) { var regex = new RegExp('\\b' + k + '\\b', 'i'); return regex.test(cabecalho); }
                        return cabecalho.includes(k);
                    });
                };
                var contarCamposDeCabecalho = function(linha) {
                    var encontrados = {};
                    linha.forEach(function(celula) {
                        var cab = normalizarTexto(celula);
                        if (!cab || pareceValorDeDado(cab)) return;
                        Object.keys(keywords).forEach(function(campo) {
                            if (!encontrados[campo] && cabecalhoBateComKeywords(cab, keywords[campo])) { encontrados[campo] = true; }
                        });
                    });
                    return Object.keys(encontrados).length;
                };
                var idxLinhaCabecalho = -1;
                var cabecalhos = [];
                for (var r = 0; r < Math.min(10, jsonDaPlanilha.length); r++) {
                    if(!jsonDaPlanilha[r]) continue;
                    var qtdCamposCabecalho = contarCamposDeCabecalho(jsonDaPlanilha[r]);
                    if (qtdCamposCabecalho >= 2 || (qtdCamposCabecalho === 1 && jsonDaPlanilha[r].length === 1)) {
                        idxLinhaCabecalho = r; cabecalhos = jsonDaPlanilha[r].map(function(c) { return normalizarTexto(c); }); break;
                    }
                }
                
                if (idxLinhaCabecalho > -1) {
                    var isMapped = function(index) { return Object.values(mapColunas).indexOf(index) > -1; };
                    Object.keys(keywords).forEach(function(campo) {
                        var keys = keywords[campo];
                        for (var i = 0; i < cabecalhos.length; i++) { if (!isMapped(i) && keys.includes(cabecalhos[i])) { mapColunas[campo] = i; break; } }
                        if (mapColunas[campo] === -1) { for (var i = 0; i < cabecalhos.length; i++) { if (!isMapped(i)) { var matched = cabecalhoBateComKeywords(cabecalhos[i], keys); if (matched) { mapColunas[campo] = i; break; } } } }
                    });
                }
                that.ocultarOverlayLoading();
                that.abrirModalMapeamentoColunas(jsonDaPlanilha, cabecalhos, idxLinhaCabecalho, mapColunas, nomeDoArquivo);
            } catch (err) { that.ocultarOverlayLoading(); FLUIGC.toast({ title: 'Erro de Leitura:', message: 'Ocorreu um erro ao analisar a planilha.', type: 'danger' }); }
        };
        reader.readAsArrayBuffer(file);
        $(e.target).val('');
    },

    abrirModalMapeamentoColunas: function(jsonDaPlanilha, cabecalhos, idxLinhaCabecalho, mapColunasSugerido, nomeDoArquivo) {
        var that = this;
        $('#fluig-map-overlay').remove();
        var camposPainel = [{ key: 'nome', label: 'Nome do Lead' }, { key: 'cargo', label: 'Cargo' }, { key: 'email', label: 'Email' }, { key: 'telefone', label: 'Telefone' }, { key: 'linkedin', label: 'LinkedIn' }, { key: 'empresa', label: 'Empresa' }, { key: 'cnpj', label: 'CNPJ' }, { key: 'site', label: 'Site' }, { key: 'origem', label: 'Origem' }, { key: 'status', label: 'Status' }, { key: 'segmento', label: 'Segmento (dado extra)' }, { key: 'cidade', label: 'Cidade (dado extra)' }, { key: 'focal', label: 'Focal (dado extra)' }];
        var inicioDados = idxLinhaCabecalho > -1 ? idxLinhaCabecalho + 1 : 0;
        var totalColunas = 0;
        for (var li = 0; li < jsonDaPlanilha.length; li++) { if (jsonDaPlanilha[li] && jsonDaPlanilha[li].length > totalColunas) { totalColunas = jsonDaPlanilha[li].length; } }

        var amostraPorColuna = [];
        for (var ci = 0; ci < totalColunas; ci++) {
            var amostra = '';
            for (var li2 = inicioDados; li2 < jsonDaPlanilha.length; li2++) {
                var linhaAmostra = jsonDaPlanilha[li2];
                if (linhaAmostra && linhaAmostra[ci] !== undefined && String(linhaAmostra[ci]).trim() !== '') { amostra = String(linhaAmostra[ci]).trim(); break; }
            }
            amostraPorColuna.push(amostra);
        }

        var nomeColuna = function(idx) { var cab = (idxLinhaCabecalho > -1 && cabecalhos[idx]) ? cabecalhos[idx] : ''; return cab && cab.trim() !== '' ? cab : ('Coluna ' + (idx + 1)); };
        var escapeHtml = function(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

        var campoSugeridoPorColuna = {};
        Object.keys(mapColunasSugerido).forEach(function(campo) {
            var idxCol = mapColunasSugerido[campo];
            if (idxCol > -1 && campo !== 'id') { campoSugeridoPorColuna[idxCol] = campo; }
        });

        var htmlPreviewCols = '';
        for (var pc = 0; pc < totalColunas; pc++) {
            htmlPreviewCols += '<div style="min-width:150px; max-width:220px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px;"><div style="font-size:11px; font-weight:700; color:#2563eb; text-transform:uppercase; letter-spacing:.03em;">' + escapeHtml(nomeColuna(pc)) + '</div><div style="font-size:13px; color:#334155; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + escapeHtml(amostraPorColuna[pc]) + '">' + (amostraPorColuna[pc] ? escapeHtml(amostraPorColuna[pc]) : '<span style="color:#94a3b8;">(vazio)</span>') + '</div></div>';
        }

        var htmlLinhasMapeamento = '';
        for (var col = 0; col < totalColunas; col++) {
            var destinoPadrao = campoSugeridoPorColuna[col] || 'extra';
            var optionsHtml = '<option value="ignore"' + (destinoPadrao === 'ignore' ? ' selected' : '') + '>-- Não importar --</option>';
            camposPainel.forEach(function(campo) { optionsHtml += '<option value="' + campo.key + '"' + (destinoPadrao === campo.key ? ' selected' : '') + '>' + escapeHtml(campo.label) + '</option>'; });
            optionsHtml += '<option value="extra"' + (destinoPadrao === 'extra' ? ' selected' : '') + '>Dado Extra (mantém nome da coluna)</option>';
            var rotuloColuna = nomeColuna(col) + (amostraPorColuna[col] ? (' (Ex: ' + amostraPorColuna[col].substring(0, 25) + ')') : '');
            htmlLinhasMapeamento += '<div style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid #f1f5f9;"><label style="width:260px; flex-shrink:0; font-weight:600; color:#1f2937; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + escapeHtml(rotuloColuna) + '">' + escapeHtml(rotuloColuna) + '</label><select class="fluig-map-select" data-coluna="' + col + '" style="flex:1; padding:8px 10px; border-radius:6px; border:1px solid #cbd5e1; background:white; font-size:13px;">' + optionsHtml + '</select></div>';
        }

        var modalHtml = '<div id="fluig-map-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(17, 24, 39, 0.75); z-index:99998; display:flex; align-items:center; justify-content:center; font-family:sans-serif;"><div style="background:white; width:90%; max-width:760px; max-height:85vh; overflow-y:auto; border-radius:12px; padding:24px; box-shadow:0 10px 40px rgba(0,0,0,0.3);"><h2 style="margin:0 0 4px 0; font-size:19px; color:#1f2937;"><i class="fa-solid fa-table-columns" style="color:#2563eb; margin-right:8px;"></i>Conferir Colunas da Planilha</h2><p style="margin:0 0 16px 0; font-size:13px; color:#64748b;">Arquivo: <strong>' + escapeHtml(nomeDoArquivo) + '</strong>. Confira abaixo as colunas lidas da planilha.</p><div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:10px; margin-bottom:18px;">' + htmlPreviewCols + '</div><h3 style="font-size:14px; color:#1f2937; margin:0 0 4px 0;">Mapeamento de Colunas</h3><p style="margin:0 0 10px 0; font-size:12px; color:#64748b;">Todas as colunas encontradas na planilha estão listadas abaixo.</p><div class="fluig-map-linhas">' + htmlLinhasMapeamento + '</div><div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px;"><button type="button" class="btn-danger-outline fluig-map-cancelar">Cancelar</button><button type="button" class="btn-success fluig-map-confirmar"><i class="fa-solid fa-check"></i> Confirmar Importação</button></div></div></div>';
        $('body').append(modalHtml);
        $('#fluig-map-overlay').on('click', '.fluig-map-cancelar', function() { $('#fluig-map-overlay').remove(); });
        $('#fluig-map-overlay').on('click', '.fluig-map-confirmar', function() {
            var destinoColunas = {};
            $('#fluig-map-overlay .fluig-map-select').each(function() { var col = parseInt($(this).data('coluna'), 10); destinoColunas[col] = $(this).val(); });

            var possuiColunaEmail = Object.keys(destinoColunas).some(function(col) { return destinoColunas[col] === 'email'; });
            if (!possuiColunaEmail) {
                FLUIGC.toast({ title: 'Aviso:', message: 'A planilha precisa ter uma coluna mapeada como "Email" para ser importada, pois o e-mail é a chave primária dos leads.', type: 'warning' });
                return;
            }

            $('#fluig-map-overlay').remove();
            that.mostrarOverlayLoading('A importar...', 'Processando leads da planilha...');
            that.continuarImportacaoComMapeamento(jsonDaPlanilha, cabecalhos, idxLinhaCabecalho, destinoColunas, nomeDoArquivo);
        });
    },

    continuarImportacaoComMapeamento: function(jsonDaPlanilha, cabecalhos, idxLinhaCabecalho, destinoColunas, nomeDoArquivo) {
        var that = this;
        try {
            var leadsParaImportar = [];
            var inicio = idxLinhaCabecalho > -1 ? idxLinhaCabecalho + 1 : 0;
            var leadsIgnoradosPorEmail = 0;
            var maxId = parseInt(this.obterProximoIdContato(), 10) - 1;

            for (var i = inicio; i < jsonDaPlanilha.length; i++) {
                var colunas = jsonDaPlanilha[i];
                if (!colunas || colunas.length === 0) continue;
                var valores = { nome: '', cargo: '', email: '', telefone: '', linkedin: '', empresa: '', cnpj: '', site: '', origem: '', status: '' };
                var extraFields = {};

                for (var c = 0; c < colunas.length; c++) {
                    var destino = destinoColunas[c] || 'ignore';
                    if (destino === 'ignore') continue;
                    var val = String(colunas[c] || '').trim();
                    if (val === '') continue;

                    if (destino === 'extra') {
                        var headerName = (idxLinhaCabecalho > -1 && cabecalhos[c] && cabecalhos[c].trim() !== '') ? cabecalhos[c] : ('Coluna_' + (c + 1));
                        extraFields[headerName] = val;
                    } else if (destino === 'segmento') { extraFields['Segmento'] = val; } 
                    else if (destino === 'cidade') { extraFields['Cidade'] = val; } 
                    else if (destino === 'focal') { extraFields['Focal'] = val; } 
                    else if (valores.hasOwnProperty(destino)) { valores[destino] = val; }
                }

                var vNome = valores.nome, vCargo = valores.cargo, vEmail = valores.email, vTelefone = valores.telefone, vLinkedin = valores.linkedin, vEmpresa = valores.empresa, vCnpj = valores.cnpj, vSite = valores.site;
                var vOrigem = valores.origem || 'Arquivo'; var vStatus = valores.status || 'Novo';
                var dadosExtrasStr = Object.keys(extraFields).length > 0 ? JSON.stringify(extraFields) : "";

                if (!vNome && !vEmail && !vTelefone && !vEmpresa && !dadosExtrasStr) continue;

                if (vEmail && vEmail.trim() !== '') {
                    var emailNorm = vEmail.trim().toLowerCase();
                    if (that.emailJaCadastrado(emailNorm)) { leadsIgnoradosPorEmail++; continue; }
                    var duplicadoNaPlanilha = leadsParaImportar.some(function(l) { return (l.email || '').trim().toLowerCase() === emailNorm; });
                    if (duplicadoNaPlanilha) { leadsIgnoradosPorEmail++; continue; }
                }

                var leadObj = { documentId: null, idContato: "", nomeContato: vNome, cargo: vCargo, email: vEmail, telefone: vTelefone, linkedin: vLinkedin, nomeEmpresa: vEmpresa, cnpj: vCnpj, site: vSite, origem: vOrigem, status: vStatus, fonteInsercao: nomeDoArquivo, dados_extras: dadosExtrasStr };
                leadsParaImportar.push(leadObj);
            }

            leadsParaImportar.sort(function(a, b) {
                var empA = (a.nomeEmpresa || '').trim(); var empB = (b.nomeEmpresa || '').trim();
                var comp = empA.localeCompare(empB, 'pt-BR', { sensitivity: 'base' });
                if (comp !== 0) return comp;
                var nomeA = (a.nomeContato || '').trim(); var nomeB = (b.nomeContato || '').trim();
                return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
            });

            for (var j = 0; j < leadsParaImportar.length; j++) { maxId++; leadsParaImportar[j].idContato = String(maxId); }
            if (leadsParaImportar.length > 0) {
                try { window.localStorage.setItem(this.chaveContadorIdLead, String(maxId)); } catch(e) { }
            }

            if (leadsParaImportar.length > 0) { that.importacaoEmLoteAPI(leadsParaImportar, 0, leadsIgnoradosPorEmail); } 
            else {
                that.ocultarOverlayLoading();
                var msg = leadsIgnoradosPorEmail > 0 ? 'Nenhum lead novo para importar. ' + leadsIgnoradosPorEmail + ' registro(s) ignorado(s) por e-mail duplicado.' : 'Não foram encontrados dados válidos na planilha.';
                FLUIGC.toast({ title: 'Aviso:', message: msg, type: 'warning' });
            }
        } catch (err) { that.ocultarOverlayLoading(); FLUIGC.toast({ title: 'Erro de Importação:', message: 'Ocorreu um erro ao importar os dados mapeados.', type: 'danger' }); }
    },

    importacaoEmLoteAPI: function(leadsArray, index, ignoradosCount) {
        var that = this;
        var ignorados = ignoradosCount || 0;
        if (index >= leadsArray.length) {
            that.ocultarOverlayLoading();
            var msgConcluido = leadsArray.length + ' leads importados com sucesso.';
            if (ignorados > 0) { msgConcluido += ' (' + ignorados + ' ignorados por já estarem cadastrados).'; }
            FLUIGC.toast({ title: 'Concluído!', message: msgConcluido, type: 'success' });
            that.atualizarPainelCompleto();
            return;
        }
        
        var pct = Math.round((index / leadsArray.length) * 100);
        that.mostrarOverlayLoading('A gravar no servidor...', 'Processando: ' + index + ' de ' + leadsArray.length, pct);
        
        var leadObj = leadsArray[index];
        var payload = {
            "documentDescription": leadObj.nomeContato + " - " + leadObj.nomeEmpresa, "version": 1000, "parentDocumentId": parseInt(this.idFormularioFluig),
            "formData": [
                { "name": "lead_id", "value": leadObj.idContato || "" }, { "name": "lead_nome", "value": leadObj.nomeContato || "" }, { "name": "lead_cargo", "value": leadObj.cargo || "" }, { "name": "lead_telefone", "value": leadObj.telefone || "" }, { "name": "lead_email", "value": leadObj.email || "" }, { "name": "lead_linkedin", "value": leadObj.linkedin || "" }, { "name": "empresa_nome", "value": leadObj.nomeEmpresa || "" }, { "name": "empresa_cnpj", "value": leadObj.cnpj || "" }, { "name": "empresa_site", "value": leadObj.site || "" }, { "name": "lead_origem", "value": leadObj.origem || "" }, { "name": "lead_status", "value": leadObj.status || "" }, { "name": "fonte_insercao", "value": leadObj.fonteInsercao || "" }, { "name": "dados_extras", "value": leadObj.dados_extras || "" }
            ]
        };
        $.ajax({
            url: "/api/public/2.0/cards/create", type: "POST", contentType: "application/json", data: JSON.stringify(payload),
            success: function(data) {
                var dadosExtraidos = data.content ? (Array.isArray(data.content) ? data.content[0] : data.content) : data;
                var documentId = dadosExtraidos.documentId || dadosExtraidos.documentid || dadosExtraidos.id || null;
                if (documentId) { leadObj.documentId = documentId; }
                if (dadosExtraidos.version) { leadObj.version = dadosExtraidos.version; }
                
                that.todosOsLeadsMemoria.push(leadObj);
                that.importacaoEmLoteAPI(leadsArray, index + 1, ignorados);
            },
            error: function(err) { that.importacaoEmLoteAPI(leadsArray, index + 1, ignorados); }
        });
    },

    limparPesquisa: function() {
        this.DOM.find('.search-input').val(''); this.DOM.find('.filter-text').val(''); this.DOM.find('.filter-status').val('todos'); this.DOM.find('.filter-method').val('todos'); this.DOM.find('.filter-column').val('todos'); this.DOM.find('.filter-tipo-registro').val('todos'); this.DOM.find('.select-limite').val('10');
        this.filtroFonte = 'todos'; this.itensPorPagina = 10; this.paginaAtual = 1; this.atualizarPainelCompleto();
    },

    mudarLimiteExibicao: function(el) {
        var valor = $(el).val();
        if (valor === 'manuais') { this.filtroFonte = 'manual'; this.itensPorPagina = 'todos'; } 
        else if (valor === 'arquivos') { this.filtroFonte = 'arquivo'; this.itensPorPagina = 'todos'; } 
        else { this.filtroFonte = 'todos'; this.itensPorPagina = valor === 'todos' ? 'todos' : parseInt(valor); }
        this.paginaAtual = 1; this.atualizarPainelCompleto();
    },

    leadCorrespondeAoMetodo: function(lead, rowFonte, metodoFiltro) {
        if (metodoFiltro === 'todos') return true;
        if (metodoFiltro.indexOf('arquivo::') === 0) {
            var nomeArquivoFiltro = metodoFiltro.substring('arquivo::'.length);
            return rowFonte === 'arquivo' && String((lead && lead.fonteInsercao) || '').trim() === nomeArquivoFiltro;
        }
        return rowFonte === metodoFiltro;
    },

    atualizarOpcoesFiltroMetodo: function(listaDeLeads) {
        var select = this.DOM.find('.filter-method');
        if (!select.length) return;
        var valorAtual = select.val();
        select.find('optgroup.optgroup-arquivos').remove();

        var arquivosUnicos = []; var jaAdicionado = {};
        listaDeLeads.forEach(function(lead) {
            var rowFonte = lead.fonteInsercao === 'Manualmente' ? 'manual' : (lead.fonteInsercao === 'Diagnóstico' ? 'diagnostico' : 'arquivo');
            if (rowFonte !== 'arquivo') return;
            var nomeArquivo = String(lead.fonteInsercao || '').trim();
            if (nomeArquivo && !jaAdicionado[nomeArquivo]) { jaAdicionado[nomeArquivo] = true; arquivosUnicos.push(nomeArquivo); }
        });
        arquivosUnicos.sort(function(a, b) { return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }); });

        if (arquivosUnicos.length > 0) {
            var optgroup = $('<optgroup class="optgroup-arquivos" label="Arquivos Importados"></optgroup>');
            arquivosUnicos.forEach(function(nomeArquivo) { optgroup.append($('<option></option>').attr('value', 'arquivo::' + nomeArquivo).text(nomeArquivo)); });
            select.append(optgroup);
        }
        var opcaoAindaExiste = select.find('option').filter(function() { return $(this).val() === valorAtual; }).length > 0;
        select.val(opcaoAindaExiste ? valorAtual : 'todos');
    },

    paginaAnterior: function() { if (this.paginaAtual > 1) { this.paginaAtual--; this.atualizarPainelCompleto(); } },
    pesquisarLead: function() { this.paginaAtual = 1; this.atualizarPainelCompleto(); },
    
    proximaPagina: function() {
        var totalPaginas = this.itensPorPagina === 'todos' ? 1 : Math.ceil(this.totalFiltrado / this.itensPorPagina);
        if (this.paginaAtual < totalPaginas) { this.paginaAtual++; this.atualizarPainelCompleto(); }
    },

    atualizarPainelCompleto: function() {
        var that = this;
        var termo = (this.DOM.find('.filter-text').val() || this.DOM.find('.search-input').val() || '').toLowerCase().trim();
        var statusFiltro = this.DOM.find('.filter-status').val();
        var metodoFiltro = this.DOM.find('.filter-method').val();
        var colunaFiltro = this.DOM.find('.filter-column').val() || 'todos';
        var tipoRegistroFiltro = this.DOM.find('.filter-tipo-registro').val() || 'todos';
        var dom = this.DOM;

        this.atualizarOpcoesFiltroMetodo(this.todosOsLeadsMemoria);
        metodoFiltro = dom.find('.filter-method').val();

        var linhasFiltradas = this.todosOsLeadsMemoria.filter(function(lead) {
            var matchTexto = true;
            if (termo !== '') {
                if (colunaFiltro === 'todos') {
                    var textoCompleto = Object.values(lead).join(' ').toLowerCase();
                    matchTexto = textoCompleto.includes(termo);
                } else if (colunaFiltro === 'idContato') {
                    var termoId = termo.replace(/\D/g, '');
                    var valorColuna = String(lead[colunaFiltro] || '').replace(/\D/g, '');
                    matchTexto = (valorColuna === termoId);
                } else {
                    var valorColuna = String(lead[colunaFiltro] || '').toLowerCase();
                    matchTexto = valorColuna.includes(termo);
                }
            }
            var rowFonte = (lead.fonteInsercao === 'Manualmente' ? 'manual' : (lead.fonteInsercao === 'Diagnóstico' ? 'diagnostico' : 'arquivo'));
            var matchFonte = (that.filtroFonte === 'todos') || (rowFonte === that.filtroFonte);
            var rowStatus = (lead.status || '').toLowerCase().trim();
            var matchStatus = statusFiltro === 'todos' || rowStatus === statusFiltro;
            var matchMetodo = that.leadCorrespondeAoMetodo(lead, rowFonte, metodoFiltro);
            var rowTipoRegistro = that.obterTipoRegistroLead(lead).toLowerCase();
            var matchTipoRegistro = tipoRegistroFiltro === 'todos' || rowTipoRegistro === tipoRegistroFiltro;

            return matchTexto && matchFonte && matchStatus && matchMetodo && matchTipoRegistro;
        });

        if (this.ordenacaoColuna) {
            var campoOrdenacao = this.ordenacaoColuna;
            var direcao = this.ordenacaoDirecao === 'desc' ? -1 : 1;
            linhasFiltradas.sort(function(a, b) {
                var valA = String((a[campoOrdenacao] || '')).trim();
                var valB = String((b[campoOrdenacao] || '')).trim();
                if (campoOrdenacao === 'idContato') {
                    var numA = parseInt(valA.replace(/\D/g, ''), 10) || 0;
                    var numB = parseInt(valB.replace(/\D/g, ''), 10) || 0;
                    return (numA - numB) * direcao;
                }
                return valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' }) * direcao;
            });
        }

        this.totalFiltrado = linhasFiltradas.length;

        var inicio = this.itensPorPagina === 'todos' ? 0 : (this.paginaAtual - 1) * this.itensPorPagina;
        var fim = this.itensPorPagina === 'todos' ? this.totalFiltrado : inicio + this.itensPorPagina;
        var leadsDaPagina = linhasFiltradas.slice(inicio, fim);

        var tbody = dom.find('.table-body');
        tbody.empty(); 

        var fragment = document.createDocumentFragment();
        that.ultimaFonteInserida = null;
        
        leadsDaPagina.forEach(function(lead) {
            var tr = that.adicionarNovaLinha(lead, true, true);
            fragment.appendChild(tr[0]);
        });
        
        tbody.append(fragment);
        this.verificarSelecao();
        
        if (this.totalFiltrado === 0 && this.todosOsLeadsMemoria.length > 0) {
            dom.find('.table-empty-row td').html("<i class='fa-solid fa-magnifying-glass'></i> Nenhum resultado."); dom.find('.table-empty-row').show();
        } else if (this.todosOsLeadsMemoria.length === 0) {
            dom.find('.table-empty-row td').text("Nenhum registro encontrado no Fluig."); dom.find('.table-empty-row').show();
        } else { dom.find('.table-empty-row').hide(); }
        
        dom.find('.badge-total-leads').text('Leads: ' + this.totalFiltrado);
        dom.find('.footer-text').text('Mostrando ' + (this.totalFiltrado>0?inicio+1:0) + ' até ' + Math.min(fim, this.totalFiltrado) + ' de ' + this.totalFiltrado);
        
        var novos = 0, contato = 0, convertido = 0, site = 0, redes = 0, manual = 0, arquivo = 0, diagnostico = 0;
        linhasFiltradas.forEach(function(lead) {
            var st = (lead.status || '').toLowerCase();
            var og = (lead.origem || '').toLowerCase();
            var ft = (lead.fonteInsercao === 'Manualmente' ? 'manual' : (lead.fonteInsercao === 'Diagnóstico' ? 'diagnostico' : 'arquivo'));
            
            if(st.includes('novo')) novos++; else if(st.includes('contat') || st.includes('atendimento')) contato++; else convertido++;
            if(og.includes('site')) site++; else redes++;
            if(ft === 'manual') manual++; else if(ft === 'diagnostico') diagnostico++; else arquivo++;
        });
        
        dom.find('.card-status-novos').text(novos); dom.find('.card-status-contato').text(contato); dom.find('.card-status-convertidos').text(convertido);
        dom.find('.card-origem-site').text(site); dom.find('.card-origem-redes').text(redes);
        dom.find('.card-metodo-manual').text(manual); dom.find('.card-metodo-arquivo').text(arquivo); dom.find('.card-metodo-diagnostico').text(diagnostico);
        
        this.atualizarGraficos(novos, contato, convertido, manual, arquivo, diagnostico);

        this.agendarSalvarCacheLeads();
    }
});
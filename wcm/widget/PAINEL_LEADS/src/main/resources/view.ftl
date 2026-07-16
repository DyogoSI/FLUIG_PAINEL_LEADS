<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">  
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>  
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>  
<script type="text/javascript" src="/webdesk/vcXMLRPC.js"></script>  

<div id="PainelLeads_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide painel-leads-widget" data-params="PainelLeadsWidget.instance()">          
    <div class="leads-container">                  
        <header class="panel-header">                          
            <div class="header-left">                                  
                <div class="header-logo-box">                                    
                    <img src="/PAINEL_LEADS/resources/images/IRHO-BRANCO.png" alt="Logo da Empresa" class="header-logo-image">                                  
                </div>                   
                <div class="header-title">                                          
                    <h1>PAINEL DE LEADS</h1>       
                    <p>Gestão Comercial e Captura</p>                                  
                </div> 
            </div>     
            <div class="header-right">           
                <div class="header-badge btn-reset" title="Clique para limpar pesquisas" style="cursor: pointer;">                  
                    <i class="fa-solid fa-rotate-right" style="margin-right: 6px;"></i><span class="badge-total-leads">Leads: 0</span>           
                </div>            
                <select class="header-badge select-limite dropdown-select">        
                    <option value="10" style="color: black;">Exibir: 10</option>     
                    <option value="25" style="color: black;">Exibir: 25</option>             
                    <option value="50" style="color: black;">Exibir: 50</option>                                          
                    <option value="todos" style="color: black;">Exibir: Todos</option>                  
                </select>                          
            </div>         
        </header>    

        <section class="filter-container">          
            <div class="filter-row-1">                                  
                <div class="search-input-wrapper">                    
                    <i class="fa-solid fa-search"></i>     
                    <input type="text" class="search-input" placeholder="Pesquisar lead globalmente...">        
                </div>      
                <div class="date-range-wrapper">           
                    <span>De:</span>                                          
                    <input type="date">          
                    <span>Até:</span>   
                    <input type="date">     
                </div>        
                <button class="btn-primary">    
                    <i class="fa-solid fa-calendar-check"></i> Aplicar 
                </button>                        
                <button type="button" class="btn-primary btn-sync">                     
                    <i class="fa-solid fa-rotate"></i> Sincronizar                 
                </button>        
            </div>                  
         </section>                  

        <section class="cards-grid">          
            <div class="card"> 
                <h3 class="card-title"><i class="fa-solid fa-info-circle icon-blue"></i> Status do Funil</h3>                   
                <div style="display: flex; align-items: center; justify-content: space-between;">                     
                    <div class="card-list" style="flex: 1; padding-right: 15px;">                                              
                        <div class="card-item"><span class="card-item-label"><i class="fa-solid fa-circle" style="color: #cbd5e1; font-size: 10px; margin-right: 6px;"></i> Novos</span><span class="card-item-value card-status-novos">0</span></div>                                              
                        <div class="card-item"><span class="card-item-label"><i class="fa-solid fa-circle" style="color: #3b82f6; font-size: 10px; margin-right: 6px;"></i> Em Contato</span><span class="card-item-value card-status-contato">0</span></div>                                              
                        <div class="card-item"><span class="card-item-label"><i class="fa-solid fa-circle" style="color: #10b981; font-size: 10px; margin-right: 6px;"></i> Convertidos</span><span class="card-item-value card-status-convertidos">0</span></div>                                      
                    </div>                                  
                    <div class="canvas-container" style="position: relative; height: 90px; width: 90px; flex-shrink: 0;">                         
                        <canvas class="chart-status-funil"></canvas>                     
                    </div>    
                </div>             
            </div>                          

            <div class="card">       
                <h3 class="card-title"><i class="fa-solid fa-file-signature icon-green"></i> Método</h3>                                  
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div class="card-list" style="flex: 1; padding-right: 15px;">                                          
                        <div class="card-item"><span class="card-item-label"><i class="fa-solid fa-circle" style="color: #94a3b8; font-size: 10px; margin-right: 6px;"></i> Manual</span><span class="card-item-value card-metodo-manual">0</span></div>                                          
                        <div class="card-item"><span class="card-item-label"><i class="fa-solid fa-circle" style="color: #10b981; font-size: 10px; margin-right: 6px;"></i> Arquivo</span><span class="card-item-value card-metodo-arquivo">0</span></div>                                  
                        <div class="card-item"><span class="card-item-label"><i class="fa-solid fa-circle" style="color: #1e40af; font-size: 10px; margin-right: 6px;"></i> Integração Diagnóstico</span><span class="card-item-value card-metodo-diagnostico">0</span></div>                                  
                    </div>                          
                    <div class="canvas-container" style="position: relative; height: 90px; width: 90px; flex-shrink: 0;">                         
                        <canvas class="chart-metodo-leads"></canvas>                     
                    </div>        
                </div>
            </div>                  
        </section>                  

        <section class="filter-panel" style="margin: 18px 0 0 0; padding: 16px; border-radius: 12px; background-color: #ffffff; border: 1px solid #e2e8f0;">                          
            <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between;">                          
                
                <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 220px;">                          
                    <label style="font-weight: 600; color: #1f2937; white-space: nowrap;">Status:</label>                          
                    <select class="filter-status" style="flex: 1; width: 100%; min-width: 0; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: white; text-overflow: ellipsis;">                          
                        <option value="todos">Todos</option>                          
                        <option value="novo">Novo</option>                          
                        <option value="contato">Contato</option>                          
                        <option value="convertido">Convertido</option>                          
                    </select>                          
                </div> 

                <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 220px;">                          
                    <label style="font-weight: 600; color: #1f2937; white-space: nowrap;">Método:</label>                          
                    <select class="filter-method" style="flex: 1; width: 100%; min-width: 0; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: white; text-overflow: ellipsis;">                          
                        <option value="todos">Todos</option>                          
                        <option value="manual">Manual</option>                          
                        <option value="diagnostico">Integração Diagnóstico</option>                          
                    </select>                          
                </div>   
                       
                <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 200px;">                          
                    <label style="font-weight: 600; color: #1f2937; white-space: nowrap;">Coluna:</label>                          
                    <select class="filter-column" style="flex: 1; width: 100%; min-width: 0; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: white; text-overflow: ellipsis;">                          
                        <option value="todos">Todas as Colunas</option>                          
                        <option value="idContato">ID</option>                          
                        <option value="nomeContato">Nome</option>                          
                        <option value="email">Email</option>                          
                        <option value="telefone">Telefone</option>                          
                        <option value="nomeEmpresa">Empresa</option>                          
                        <option value="cnpj">CNPJ</option>                          
                        <option value="site">Site</option>                          
                    </select>                          
                </div>

                <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 200px;">
                    <label style="font-weight: 600; color: #1f2937; white-space: nowrap;">Tipo Registro:</label>
                    <select class="filter-tipo-registro" style="flex: 1; width: 100%; min-width: 0; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: white; text-overflow: ellipsis;">
                        <option value="todos">Todos</option>
                        <option value="cliente">Cliente</option>
                        <option value="parceiro">Parceiro</option>
                    </select>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 240px;">
                    <label style="font-weight: 600; color: #1f2937; white-space: nowrap;">Buscar:</label>                        
                    <input type="text" class="filter-text" placeholder="Filtrar registros..." style="flex: 1; width: 100%; min-width: 0; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: white;">                          
                </div>                          
            </div>          
        </section>                          
        
        <section class="table-container">                          
            <div class="table-actions">  
                <input type="file" class="file-input" accept=".csv, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display: none;">                                           
                <div class="default-actions" style="display: flex; gap: 12px; margin-left: auto;">
                    <button type="button" class="btn-primary btn-select-all-global" style="background-color: #3b82f6; border: none;">                                                  
                        <i class="fa-solid fa-check-double"></i> Selecionar Todos                     
                    </button>                                          
                    <button type="button" class="btn-primary btn-import-file"><i class="fa-solid fa-file-import"></i> Importar</button>            
                    <button type="button" class="btn-success btn-add-record"><i class="fa-solid fa-plus"></i> Novo Registro</button>                       
                </div>    
                              
                <div class="selection-actions" style="display: none; width: 100%; align-items: center; background-color: #eff6ff; padding: 6px 16px; border-radius: 8px; border: 1px solid #bfdbfe;">                                          
                    <span class="selected-count-text" style="font-size: 14px; font-weight: 600; color: #1e3a8a; margin-right: auto;">0 lead(s) selecionado(s)</span>                                                               
                    <div style="display: flex; gap: 12px; align-items: center;">                                                  
                        <button type="button" class="btn-edit-selected" style="display: none; background-color: #f59e0b; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">                                                          
                            <i class="fa-solid fa-pen" style="margin-right: 4px;"></i> Editar        
                        </button>                                  
                        <button type="button" class="btn-delete-selected" style="display: none; background-color: #ef4444; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">                                                          
                            <i class="fa-solid fa-trash-can" style="margin-right: 4px;"></i> Apagar        
                        </button>                                  
                        <div style="width: 1px; height: 24px; background-color: #93c5fd; margin: 0 4px;"></div>                                                  
                        <button type="button" class="btn-cancel-selection" style="background-color: transparent; color: #475569; border: 1px solid #94a3b8; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">                                                          
                            Cancelar             
                        </button>                                       
                    </div>                 
                </div>                          
            </div>                          
   
            <div class="table-responsive">    
                <table class="custom-table w-100">                                      
                    <thead>                        
                        <tr>                
                            <th class="col-checkbox" style="display: none; width: 45px; text-align: center;">                                                                  
                               <input type="checkbox" class="chk-select-all" style="cursor: pointer; width: 15px; height: 15px;">                                                          
                            </th>     
                            <th class="th-sortable" data-campo="idContato" style="cursor: pointer;">ID <i class="fa-solid fa-sort-down sort-icon" style="margin-left: 4px; color: #2563eb; font-size: 11px;"></i></th>
                            <th class="th-sortable" data-campo="nomeEmpresa" style="cursor: pointer;">Nome <i class="fa-solid fa-sort sort-icon" style="margin-left: 4px; color: #94a3b8; font-size: 11px;"></i></th>
                            <th class="th-sortable" data-campo="email" style="cursor: pointer;">Email <i class="fa-solid fa-sort sort-icon" style="margin-left: 4px; color: #94a3b8; font-size: 11px;"></i></th>
                            <th class="th-sortable" data-campo="telefone" style="cursor: pointer;">Telefone <i class="fa-solid fa-sort sort-icon" style="margin-left: 4px; color: #94a3b8; font-size: 11px;"></i></th>
                            <th class="th-sortable" data-campo="site" style="cursor: pointer;">Site <i class="fa-solid fa-sort sort-icon" style="margin-left: 4px; color: #94a3b8; font-size: 11px;"></i></th>
                        </tr>                         
                    </thead>        
                    <tbody class="table-body">          
                        <tr class="table-empty-row"><td colspan="6" style="text-align: center; padding: 30px;">Nenhum registro encontrado</td></tr>                                          
                    </tbody>                                  
                 </table>                          
            </div>                          
            <div class="table-footer">       
                 <div class="footer-text">Mostrando 0 até 0 de 0 registros</div>                                  
                <div class="pagination-buttons">                         
                    <button class="btn-primary btn-prev">Anterior</button>                                    
                    <button class="btn-primary btn-next">Próximo</button>    
                </div>  
            </div>                  
        </section>          
    </div>          

    <div class="modal-overlay hidden">         
         <div class="modal-content"> 
            <div class="modal-header">                       
                <h2 class="modal-title-text">Novo Lead</h2>          
                <button class="btn-close-modal"><i class="fa-solid fa-times"></i></button>      
             </div>    
            <form class="form-add-lead">                                  
                <div class="form-section">                     
                     <h4>Dados Básicos</h4>                                          
                    <input type="text" class="lead-id" placeholder="ID" readonly title="ID gerado automaticamente"> 
                    <input type="text" class="lead-nome" required placeholder="Nome Completo *">                                 
                    <input type="text" class="lead-cargo" placeholder="Cargo">      
                    <input type="text" class="lead-telefone" placeholder="Telefone"> 
                    <input type="email" class="lead-email" required placeholder="Email *">
                    <div class="alerta-email-cadastrado" style="display:none; align-items:center; gap:6px; margin-top:-8px; margin-bottom:10px; padding:8px 10px; border-radius:6px; background-color:#fef2f2; border:1px solid #fecaca; color:#b91c1c; font-size:12px; font-weight:600;">
                        <i class="fa-solid fa-triangle-exclamation"></i><span class="alerta-email-cadastrado-texto">Este e-mail já foi cadastrado.</span>
                    </div>                           
                    <input type="text" class="lead-linkedin" placeholder="LinkedIn">                                  
                </div>                     
 
                <div class="form-section">          
                    <h4>Empresa</h4>                       
                    <input type="text" class="empresa-nome" required placeholder="Nome da Empresa *">  
                    <input type="text" class="empresa-cnpj" placeholder="CNPJ">     
                    <input type="text" class="empresa-site" placeholder="Site (ex: www.empresa.com.br)">                  
                </div>                      
 
                <div class="form-section">                       
                    <h4>Status do Funil</h4>  
                    <select class="lead-origem" required>             
                        <option value="Site">Site</option><option value="Redes">Redes</option>                 
                    </select>         
                    <select class="lead-status" required>                        
                        <option value="Novo">Novo</option><option value="Contato">Contato</option><option value="Convertido">Convertido</option>                            
                    </select>    
                </div>                  

                <div class="form-section extra-fields-container" style="display: none;">
                    <h4>Dados Adicionais</h4>
                    <div class="extra-fields-content"></div>
                </div>

                <div class="form-section">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div class="diagnostico-etiqueta" style="margin-bottom: 0;">
                            <i class="fa-solid fa-stethoscope"></i><span class="diagnostico-etiqueta-texto">Diagnóstico</span>
                        </div>
                        <a href="#" target="_blank" class="btn-abrir-diagnostico" style="display: none; align-items: center; gap: 6px; font-size: 13px; color: #2563eb; font-weight: 600; text-decoration: none; padding: 4px 10px; border-radius: 20px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#eff6ff'" onmouseout="this.style.backgroundColor='transparent'">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Formulário
                        </a>
                    </div>
                    
                    <button type="button" class="btn-primary btn-escolher-diagnostico" style="width: 100%; padding: 10px; border-radius: 6px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; background-color: #0ea5e9; border: none;">
                        <i class="fa-solid fa-stethoscope"></i> Escolher Diagnóstico
                    </button>
                </div>

                <div class="form-section">
                    <h4>Tipo Registro</h4>
                    <div class="tipo-registro-group" style="display: flex; gap: 12px;">
                        <label class="tipo-registro-option selecionado" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-weight: 600; color: #4b5563;">
                            <input type="radio" name="tipoRegistro" class="lead-tipo-registro" value="Cliente" checked style="cursor: pointer;"> Cliente
                        </label>
                        <label class="tipo-registro-option" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-weight: 600; color: #4b5563;">
                            <input type="radio" name="tipoRegistro" class="lead-tipo-registro" value="Parceiro" style="cursor: pointer;"> Parceiro
                        </label>
                    </div>
                </div>

                <button type="button" class="btn-primary btn-delete-lead-modal" style="display: none; width: 100%; padding: 10px; border-radius: 6px; font-weight: 600; align-items: center; justify-content: center; gap: 8px; background-color: #ef4444; border: none; margin-bottom: 16px;">
                    <i class="fa-solid fa-trash"></i> Excluir Registro
                </button>

                <div class="modal-footer" style="align-items: center;">
                    <button type="button" class="btn-primary btn-fill-test" style="margin-right: auto; padding: 8px 12px; font-size: 12px; background-color: #6b7280;" title="REMOVER EM PRODUÇÃO">
                        <i class="fa-solid fa-flask"></i> Auto-Preencher
                    </button>
                    <button type="button" class="btn-danger-outline btn-cancel-modal">Cancelar</button>
                    <button type="submit" class="btn-success btn-submit-modal">Salvar</button>
                </div>
            </form>               
        </div>        
    </div>  
</div>
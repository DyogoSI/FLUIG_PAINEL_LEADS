window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Obrigatoriedade = (function () {
    "use strict";

    function validarTentativas(exigirAoMenosUma) {
        var erros = [];
        var indices = IRHOLeads.Dados.indicesTentativas();

        if (exigirAoMenosUma && !indices.length) {
            erros.push("Registre ao menos uma tentativa de contato.");
            return erros;
        }

        indices.forEach(function (indice, posicao) {
            var numero = posicao + 1;
            var meio = IRHOLeads.Dados.campoFilho("tent_meio", indice).val();
            var data = $.trim(
                IRHOLeads.Dados.campoFilho("tent_data", indice).val() || ""
            );
            var hora = $.trim(
                IRHOLeads.Dados.campoFilho("tent_hora", indice).val() || ""
            );
            var descricao = $.trim(
                IRHOLeads.Dados.campoFilho("tent_descricao", indice).val() || ""
            );

            if (!meio) {
                erros.push(
                    "Informe o meio de contato da " + numero + "ª tentativa."
                );
            }

            if (!data) {
                erros.push(
                    "Informe a data da " + numero + "ª tentativa."
                );
            } else if (!dataValida(data)) {
                erros.push(
                    "Informe uma data válida na " + numero + "ª tentativa."
                );
            }

            if (hora && !horaValida(hora)) {
                erros.push(
                    "Informe um horário válido na " + numero + "ª tentativa."
                );
            }

            if (!descricao) {
                erros.push(
                    "Descreva as informações da " + numero + "ª tentativa."
                );
            }

            if (descricao.length > 2000) {
                erros.push(
                    "A descrição da "
                    + numero
                    + "ª tentativa ultrapassa 2.000 caracteres."
                );
            }
        });

        return erros;
    }

    function dataValida(valor) {
        var partes;
        var data;

        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
            return false;
        }

        partes = valor.split("/");
        data = new Date(
            parseInt(partes[2], 10),
            parseInt(partes[1], 10) - 1,
            parseInt(partes[0], 10)
        );

        return data.getFullYear() === parseInt(partes[2], 10)
            && data.getMonth() === parseInt(partes[1], 10) - 1
            && data.getDate() === parseInt(partes[0], 10);
    }

    function horaValida(valor) {
        var partes;
        var hora;
        var minuto;

        if (!/^\d{2}:\d{2}$/.test(valor)) {
            return false;
        }

        partes = valor.split(":");
        hora = parseInt(partes[0], 10);
        minuto = parseInt(partes[1], 10);

        return hora >= 0 && hora <= 23
            && minuto >= 0 && minuto <= 59;
    }

    function validarClassificacao() {
        var erros = [];

        var campos = [
            {
                nome:
                    "class_interesse",

                rotulo:
                    "Interesse Inicial"
            },
            {
                nome:
                    "class_necessidades",

                rotulo:
                    "Necessidades e Desafios"
            },
            {
                nome:
                    "class_orcamento",

                rotulo:
                    "Orçamento Disponível"
            },
            {
                nome:
                    "class_timeline",

                rotulo:
                    "Timeline de Decisão"
            },
            {
                nome:
                    "class_autoridade",

                rotulo:
                    "Autoridade de Decisão"
            },
            {
                nome:
                    "class_comunicacao",

                rotulo:
                    "Preferências de Comunicação"
            }
        ];

        campos.forEach(function (campo) {
            var valor = $.trim(
                $("#" + campo.nome)
                    .val()
                || ""
            );

            if (valor === "") {
                erros.push(
                    "Responda à questão “"
                    + campo.rotulo
                    + "”."
                );
            }

            if (valor.length > 2000) {
                erros.push(
                    "A resposta de “"
                    + campo.rotulo
                    + "” ultrapassa 2.000 caracteres."
                );
            }
        });

        return erros;
    }

    return {
        validarTentativas:
            validarTentativas,

        validarClassificacao:
            validarClassificacao
    };
}());

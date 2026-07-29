window.IRHOLeads = window.IRHOLeads || {};

IRHOLeads.Dados = (function () {
    "use strict";

    function obterIndiceFilho(elemento) {
        var campo = $(elemento)
            .closest("tr")
            .find('[name^="tent_numero___"]')
            .first();

        if (!campo.length) {
            return "";
        }

        var nome = campo.attr("name") || "";
        return nome.indexOf("___") >= 0 ? nome.split("___")[1] : "";
    }

    function campoFilho(nomeBase, indice) {
        if (!indice) {
            return $();
        }

        return $('[name="' + nomeBase + '___' + indice + '"]');
    }

    function indicesTentativas() {
        var indices = [];

        $('[name^="tent_numero___"]').each(function () {
            var nome = $(this).attr("name") || "";
            var partes = nome.split("___");

            if (partes.length === 2 && indices.indexOf(partes[1]) === -1) {
                indices.push(partes[1]);
            }
        });

        return indices;
    }

    return {
        obterIndiceFilho: obterIndiceFilho,
        campoFilho: campoFilho,
        indicesTentativas: indicesTentativas
    };
}());

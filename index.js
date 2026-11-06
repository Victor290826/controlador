// ==========================================
// 1. ESTADO E CONFIGURAÇÃO DA APLICAÇÃO
// ==========================================

const config = JSON.parse(localStorage.getItem('financas_config')) || {
    tetoMensal: 2000.00,
    gastosMesAnteriores: 0.00,
    renda: 3000.00
};

// Verifica a data para resetar/rotacionar gastos diários automaticamente
const hojeISO = new Date().toISOString().slice(0, 10);
const ultimaData = localStorage.getItem('financas_data_ultima') || hojeISO;

let transacoesHoje = JSON.parse(localStorage.getItem('financas_transacoes')) || [];

// Se virou o dia, acumula os gastos de ontem no total do mês e limpa a cota de hoje
if (ultimaData !== hojeISO) {
    const totalOntem = transacoesHoje.reduce((acc, t) => acc + t.valor, 0);
    config.gastosMesAnteriores += totalOntem;
    transacoesHoje = [];
    localStorage.setItem('financas_config', JSON.stringify(config));
    localStorage.setItem('financas_transacoes', JSON.stringify(transacoesHoje));
    localStorage.setItem('financas_data_ultima', hojeISO);
}

let categoriaSelecionada = null;

// ==========================================
// 2. SELEÇÃO DE ELEMENTOS DO DOM
// ==========================================
const elValorHoje = document.querySelector('.valor-hoje');
const elBadgeStatus = document.querySelector('.badge-status');
const elInfoMes = document.querySelector('.info-mes span:last-child');
const elProgressoPreenchimento = document.querySelector('.progresso-preenchimento');
const elValorRenda = document.querySelector('.valor-renda-exibicao');
const elInputValor = document.getElementById('inputValor');
const elBtnsCategoria = document.querySelectorAll('.btn-categoria');
const elBtnSalvar = document.querySelector('.btn-salvar');
const elHistoricoLista = document.querySelector('.historico-lista');
const elBtnConfig = document.querySelector('.btn-config');

// ==========================================
// 3. FUNÇÕES AUXILIARES DE CÁLCULO E DATA
// ==========================================
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function obterDiasRestantesNoMes() {
    const hoje = new Date();
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    return (ultimoDia - hoje.getDate()) + 1;
}

function calcularFinancas() {
    const totalHoje = transacoesHoje.reduce((acc, t) => acc + t.valor, 0);
    const totalMes = config.gastosMesAnteriores + totalHoje;
    const saldoMesLivreInicioHoje = config.tetoMensal - config.gastosMesAnteriores;
    const diasRestantes = obterDiasRestantesNoMes();
    
    const cotaDiariaHoje = Math.max(saldoMesLivreInicioHoje, 0) / diasRestantes;
    const disponivelHoje = cotaDiariaHoje - totalHoje;
    const percentualMes = Math.min((totalMes / (config.tetoMensal || 1)) * 100, 100);

    return {
        totalHoje,
        totalMes,
        disponivelHoje,
        percentualMes
    };
}

function atualizarData() {
    const agora = new Date();
    const message = agora.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'long'
    });
    
    const elData = document.getElementById("Data");
    if (elData) {
        elData.innerHTML = message;
    }
}

// ==========================================
// 4. ATUALIZAÇÃO DA INTERFACE (RENDER)
// ==========================================
function atualizarInterface() {
    const financas = calcularFinancas();

    // 1. Atualizar Card 1: Hoje
    elValorHoje.textContent = formatarMoeda(financas.disponivelHoje);

    if (financas.disponivelHoje >= 0) {
        elBadgeStatus.textContent = '🟢 Dentro da meta';
        elBadgeStatus.style.backgroundColor = '#dcfce7';
        elBadgeStatus.style.color = '#15803d';
        elValorHoje.style.color = '#34D399';
    } else {
        const excesso = Math.abs(financas.disponivelHoje);
        elBadgeStatus.textContent = `🔴 Ultrapassou ${formatarMoeda(excesso)}`;
        elBadgeStatus.style.backgroundColor = '#fee2e2';
        elBadgeStatus.style.color = '#dc2626';
        elValorHoje.style.color = '#dc2626';
    }

    // 2. Atualizar Card 2: Mês
    elInfoMes.textContent = `${formatarMoeda(financas.totalMes)} / ${formatarMoeda(config.tetoMensal)}`;
    elProgressoPreenchimento.style.width = `${financas.percentualMes}%`;

    if (financas.totalMes > config.tetoMensal) {
        elProgressoPreenchimento.style.background = 'var(--cor-perigo)';
    } else {
        elProgressoPreenchimento.style.background = 'linear-gradient(90deg, #22c55e, #16a34a)';
    }

    // 3. Atualizar Card 3: Renda
    if (elValorRenda) {
        elValorRenda.textContent = formatarMoeda(config.renda || 0);
    }

    // 4. Atualizar Lista de Histórico
    renderizarHistorico();
}

function renderizarHistorico() {
    elHistoricoLista.innerHTML = '';

    if (transacoesHoje.length === 0) {
        elHistoricoLista.innerHTML = '<div style="text-align: center; color: var(--cor-gray); padding: 12px; font-size: 0.85rem;">Nenhum gasto registrado hoje.</div>';
        return;
    }

    [...transacoesHoje].reverse().forEach(item => {
        const divItem = document.createElement('div');
        divItem.className = 'item-historico';
        divItem.innerHTML = `
            <span class="descricao">${item.categoria}</span>
            <div class="item-historico-acoes">
                <span class="valor">- ${formatarMoeda(item.valor)}</span>
                <button class="btn-deletar" title="Excluir" onclick="deletarTransacao(${item.id})">🗑️</button>
            </div>
        `;
        elHistoricoLista.appendChild(divItem);
    });
}

function deletarTransacao(id) {
    transacoesHoje = transacoesHoje.filter(t => t.id !== id);
    localStorage.setItem('financas_transacoes', JSON.stringify(transacoesHoje));
    atualizarInterface();
}

// ==========================================
// 5. EVENTOS E INTERAÇÃO
// ==========================================

// Seleção de Categoria
elBtnsCategoria.forEach(btn => {
    btn.addEventListener('click', () => {
        elBtnsCategoria.forEach(b => {
            b.style.borderColor = 'var(--cor-borda)';
            b.style.backgroundColor = 'var(--cor-fundo-navy)';
        });

        btn.style.borderColor = '#34d399';
        btn.style.backgroundColor = '#162e3b';
        categoriaSelecionada = btn.textContent.trim();
    });
});

// Guardar Gasto
elBtnSalvar.addEventListener('click', () => {
    const valorTratado = elInputValor.value.replace(',', '.');
    const valorDigitado = parseFloat(valorTratado);

    if (isNaN(valorDigitado) || valorDigitado <= 0) {
        alert('Por favor, insira um valor válido maior que zero.');
        return;
    }

    if (!categoriaSelecionada) {
        alert('Por favor, selecione uma categoria.');
        return;
    }

    const novaTransacao = {
        id: Date.now(),
        categoria: categoriaSelecionada,
        valor: valorDigitado
    };

    transacoesHoje.push(novaTransacao);
    localStorage.setItem('financas_transacoes', JSON.stringify(transacoesHoje));

    // Reset de campos
    elInputValor.value = '';
    categoriaSelecionada = null;
    elBtnsCategoria.forEach(b => {
        b.style.borderColor = 'var(--cor-borda)';
        b.style.backgroundColor = 'var(--cor-fundo-navy)';
    });

    atualizarInterface();
});

// Configuração de Valores Reais
elBtnConfig.addEventListener('click', () => {
    const novaRenda = prompt('Digite sua Renda Mensal (R$):', config.renda);
    if (novaRenda === null) return;

    const novoTeto = prompt('Digite o Teto Mensal de Gastos (R$):', config.tetoMensal);
    if (novoTeto === null) return;

    const novosGastosAnteriores = prompt('Gastos já efetuados neste mês até ontem (R$):', config.gastosMesAnteriores);
    if (novosGastosAnteriores === null) return;

    const rendaParsed = parseFloat(novaRenda.replace(',', '.'));
    const tetoParsed = parseFloat(novoTeto.replace(',', '.'));
    const gastosParsed = parseFloat(novosGastosAnteriores.replace(',', '.'));

    if (!isNaN(rendaParsed)) config.renda = rendaParsed;
    if (!isNaN(tetoParsed)) config.tetoMensal = tetoParsed;
    if (!isNaN(gastosParsed)) config.gastosMesAnteriores = gastosParsed;

    localStorage.setItem('financas_config', JSON.stringify(config));
    atualizarInterface();
});

// ==========================================
// 6. INICIALIZAÇÃO DA PÁGINA
// ==========================================
atualizarData();
atualizarInterface();
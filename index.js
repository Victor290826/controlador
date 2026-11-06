// ==========================================
// 1. ESTADO E CONFIGURAÇÃO DA APLICAÇÃO
// ==========================================

// Carrega a configuração guardada ou usa os valores padrão se estiver vazio
const config = JSON.parse(localStorage.getItem('financas_config')) || {
    tetoMensal: 2000.00,
    gastosMesAnteriores: 1160.00
};

// Carrega as transações guardadas ou inicia com lista vazia
let transacoesHoje = JSON.parse(localStorage.getItem('financas_transacoes')) || [];

let categoriaSelecionada = null;

// ==========================================
// 2. SELEÇÃO DE ELEMENTOS DO DOM
// ==========================================
const elValorHoje = document.querySelector('.valor-hoje');
const elBadgeStatus = document.querySelector('.badge-status');
const elInfoMes = document.querySelector('.info-mes span:last-child');
const elProgressoPreenchimento = document.querySelector('.progresso-preenchimento');
const elInputValor = document.getElementById('inputValor');
const elBtnsCategoria = document.querySelectorAll('.btn-categoria');
const elBtnSalvar = document.querySelector('.btn-salvar');
const elHistoricoLista = document.querySelector('.historico-lista');

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
    const cotaDiariaHoje = saldoMesLivreInicioHoje / diasRestantes;
    const disponivelHoje = cotaDiariaHoje - totalHoje;
    const percentualMes = Math.min((totalMes / config.tetoMensal) * 100, 100);

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
        day: 'numeric',
        month: 'long',
        year: 'numeric'
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

    // 3. Atualizar Lista de Histórico
    renderizarHistorico();
}

function renderizarHistorico() {
    elHistoricoLista.innerHTML = '';

    if (transacoesHoje.length === 0) {
        elHistoricoLista.innerHTML = '<div style="text-align: center; color: var(--cor-gray); padding: 10px;">Nenhum gasto registrado hoje.</div>';
        return;
    }

    [...transacoesHoje].reverse().forEach(item => {
        const divItem = document.createElement('div');
        divItem.className = 'item-historico';
        divItem.innerHTML = `
            <span class="descricao">${item.categoria}</span>
            <span class="valor">- ${formatarMoeda(item.valor)}</span>
        `;
        elHistoricoLista.appendChild(divItem);
    });
}

// ==========================================
// 5. EVENTOS E INTERAÇÃO
// ==========================================
elBtnsCategoria.forEach(btn => {
    btn.addEventListener('click', () => {
        elBtnsCategoria.forEach(b => {
            b.style.outline = 'none';
            b.style.opacity = '0.7';
        });

        btn.style.outline = '2px solid #34d399';
        btn.style.opacity = '1';
        categoriaSelecionada = btn.textContent.trim();
    });
});

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

    // GUARDA NO LOCALSTORAGE
    localStorage.setItem('financas_transacoes', JSON.stringify(transacoesHoje));

    elInputValor.value = '';
    categoriaSelecionada = null;
    elBtnsCategoria.forEach(b => {
        b.style.outline = 'none';
        b.style.opacity = '1';
    });

    atualizarInterface();
});

// ==========================================
// 6. INICIALIZAÇÃO DA PÁGINA
// ==========================================
atualizarData();
atualizarInterface();
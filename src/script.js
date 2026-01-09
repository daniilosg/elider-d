// Estado global
let appState = {
    cities: [],
    selectedCity: '',
    plans: [],
    apiData: [],
    loading: false
};

// Configuração
const LEAD_WEBHOOK_URL = "https://n8nwb.crelo.net/webhook/content-lead";

// === Dados Padrão (Fallback) ===
const defaultData = {
    "DIRETORIA": "Central",
    "TERRITÓRIO": "Sumaré",
    "EMPRESA": "Desktop",
    "PORTFÓLIO": "PADRÃO",
    "STATUS": "Ativo",
    "CIDADE": "São José do Rio Preto",
    "UF": "SP",
    "1-PLANO": "400 Mega",
    "1-Período Oferta": "Por 3 meses",
    "1-Valor Oferta": 94.99,
    "1-Valor": 104.99,
    "1-BENEFÍCIO 1": "Wi-Fi 6 incluso",
    "1-BENEFÍCIO 2": "200 Mega de Upload",
    "1-BENEFÍCIO 3": "400 Mega de Download",
    "1-BENEFÍCIO 4": "Apps de conteúdo",
    "1-SVA": "3 licenças do Kaspersky, Skeelo, Skeelo Minibooks",
    "2-PLANO": "600 Mega",
    "2-Período Oferta": "Por 6 meses",
    "2-Valor Oferta": 99.99,
    "2-Valor": 109.99,
    "2-BENEFÍCIO 1": "Wi-Fi 6 incluso",
    "2-BENEFÍCIO 2": "300 Mega de Upload",
    "2-BENEFÍCIO 3": "600 Mega de Download",
    "2-BENEFÍCIO 4": "Apps de conteúdo",
    "2-SVA": "Paramount +, Kaspersky, Skeelo, Skeelo Minibooks, +2",
    "3-PLANO": "1 Giga",
    "3-Período Oferta": "Por 6 meses",
    "3-Valor Oferta": 119.99,
    "3-Valor": 139.99,
    "3-BENEFÍCIO 1": "Wi-Fi 6 incluso",
    "3-BENEFÍCIO 2": "500 Mega de Upload",
    "3-BENEFÍCIO 3": "1 Giga de Download",
    "3-BENEFÍCIO 4": "Apps de conteúdo",
    "3-SVA": "Paramount +, Kaspersky, Skeelo, Skeelo Minibooks, +2",
    "4-PLANO": "1 Giga Gamer",
    "4-Período Oferta": "Por 6 meses",
    "4-Valor Oferta": 169.99,
    "4-Valor": 189.99,
    "4-BENEFÍCIO 1": "Wi-Fi 6 incluso",
    "4-BENEFÍCIO 2": "500 Mega de Upload",
    "4-BENEFÍCIO 3": "1 Giga de Download",
    "4-BENEFÍCIO 4": "Apps de conteúdo",
    "4-SVA": "Paramount +, Kaspersky, Skeelo, ExitLag, +3"
};

// === Helpers de UI ===
function getBenefitIcon(benefitText) {
    if (!benefitText) return 'assets/ic-wifi-6.svg';
    const text = benefitText.toLowerCase();
    if (text.includes('upload')) return 'assets/ic-200-mega-upload.svg';
    if (text.includes('download')) return 'assets/ic-400-mega-download.svg';
    if (text.includes('apps')) return 'assets/ic-apps-conteudo.svg';
    if (text.includes('wi-fi')) return 'assets/ic-wifi-6.svg';
    return 'assets/ic-wifi-6.svg';
}

function getAppIcon(svaName) {
    if (!svaName) return null;
    const name = svaName.toLowerCase().trim();
    if (name.includes('kaspersky')) return 'assets/ic-kaspersky.png';
    if (name.includes('skeelo') && name.includes('minibooks')) return 'assets/ic-skeelo-minibooks.png';
    if (name.includes('skeelo')) return 'assets/ic-skeelo.png';
    if (name.includes('paramount')) return 'assets/ic-paramount.png';
    if (name.includes('comics')) return 'assets/ic-desktop-comics.png';
    if (name.includes('exitlag')) return 'assets/ic-exitlag.png';
    return null;
}

// === Criação do Card ===
function createPlanCard(plan, index, allPlans) {
    // Cálculo de desconto
    let discount = 0;
    if (plan.regularPrice > 0) {
        discount = Math.round(((plan.regularPrice - plan.offerPrice) / plan.regularPrice) * 100);
    }

    // Processamento de SVAs
    const svaList = plan.sva ? plan.sva.split(',').map(s => s.trim()).filter(s => s) : [];

    // Filtra e conta ícones
    const appIcons = [];
    svaList.forEach(app => {
        const icon = getAppIcon(app);
        if (icon && !appIcons.includes(icon)) { // Evita duplicados visuais simples
            appIcons.push({ src: icon, name: app });
        }
    });

    let appsHtml = '';
    appIcons.forEach(iconObj => {
        appsHtml += `<img src="${iconObj.src}" alt="${iconObj.name}" title="${iconObj.name}">`;
    });

    // Benefícios HTML
    const benefitsHtml = plan.benefits.map(benefit => `
        <li>
            <img src="${getBenefitIcon(benefit)}" alt="" width="20" height="20">
            <span>${benefit}</span>
        </li>
    `).join('');

    // Destaque (Prioridade: 800 > 600)
    // Se existir algum plano de 800 na lista geral, ele ganha destaque.
    // Se não, o de 600 ganha.
    let isHighlight = false;

    // Se não tiver acesso à lista completa (ex: chamada isolada), usa lógica local basica
    if (!allPlans) {
        isHighlight = plan.speed.includes('800') || plan.speed.includes('600');
    } else {
        const has800 = allPlans.some(p => p.speed.includes('800'));
        const has600 = allPlans.some(p => p.speed.includes('600'));

        if (has800) {
            if (plan.speed.includes('800')) isHighlight = true;
        } else if (has600) {
            if (plan.speed.includes('600')) isHighlight = true;
        }
    }

    const highlightClass = isHighlight ? 'highlight' : '';
    const badgeHtml = isHighlight ? `<div class="card-badge">MELHOR <span>oferta</span></div>` : '';

    // Formatação de preço
    const offerPriceStr = plan.offerPrice.toFixed(2).replace('.', ',');
    const regularPriceStr = plan.regularPrice.toFixed(2).replace('.', ',');

    return `
        <article class="plan-card ${highlightClass} scroll-fade">
            ${badgeHtml}
            <div class="card-header">
                <h3 class="plan-speed">${plan.speed}</h3>
                <div class="plan-price">
                    <div class="price-value">R$ ${offerPriceStr} <small>/mês</small></div>
                    <div class="price-old">
                        <span>R$ ${regularPriceStr}</span>
                        <span class="badge-off">${discount}% OFF</span>
                    </div>
                    <div class="price-condition">${plan.period || ''}</div>
                </div>
            </div>
            <ul class="plan-features">
                ${benefitsHtml}
            </ul>
            <div class="plan-apps">
                <div class="apps-label">APPS DE CONTEÚDO:</div>
                <div class="apps-icons">
                    ${appsHtml}
                </div>
            </div>
            <div class="plan-actions">
                <button type="button" class="btn btn-primary open-modal-btn" onclick="window.openPlanModal()">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"></path>
                    </svg>
                    Assine Agora
                </button>
            </div>
        </article>
    `;
}

// === Atualização de Planos ===
function updatePlansForCity(cityData) {
    if (!cityData) {
        console.warn("CityData inválido ou vazio.");
        return;
    }

    // Helper para achar chaves ignorando case/espaços
    const getVal = (obj, keyPart) => {
        const key = Object.keys(obj).find(k => k.trim().toUpperCase() === keyPart.trim().toUpperCase());
        return key ? obj[key] : undefined;
    };

    const dynamicPlans = [];

    // Tenta encontrar planos de 1 a 4
    for (let i = 1; i <= 4; i++) {
        const planName = getVal(cityData, `${i}-PLANO`);

        if (planName) {
            dynamicPlans.push({
                speed: planName,
                offerPrice: Number(getVal(cityData, `${i}-Valor Oferta`)) || 0,
                regularPrice: Number(getVal(cityData, `${i}-Valor`)) || 0,
                period: getVal(cityData, `${i}-Período Oferta`),
                benefits: [
                    getVal(cityData, `${i}-BENEFÍCIO 1`),
                    getVal(cityData, `${i}-BENEFÍCIO 2`),
                    getVal(cityData, `${i}-BENEFÍCIO 3`),
                    getVal(cityData, `${i}-BENEFÍCIO 4`)
                ].filter(b => b && b.trim() !== ''),
                sva: getVal(cityData, `${i}-SVA`),
                id: i,
                originalIndex: i
            });
        }
    }

    // Ordenação (Referência: 800 > 600 > Index)
    const sortedPlans = dynamicPlans.sort((a, b) => {
        const speedA = String(a.speed || '').toLowerCase();
        const speedB = String(b.speed || '').toLowerCase();

        if (speedA.includes('800') && !speedB.includes('800')) return -1;
        if (!speedA.includes('800') && speedB.includes('800')) return 1;
        if (speedA.includes('600') && !speedB.includes('600') && !speedA.includes('800') && !speedB.includes('800')) return -1;
        if (!speedA.includes('600') && speedB.includes('600') && !speedA.includes('800') && !speedB.includes('800')) return 1;

        return a.originalIndex - b.originalIndex;
    });

    appState.plans = sortedPlans;
    renderPlans();
}

function renderPlans() {
    const container = document.getElementById('plansContainer');
    if (!container) return;

    if (appState.plans.length > 0) {
        container.innerHTML = appState.plans.map((plan, index, arr) => createPlanCard(plan, index, arr)).join('');
        // Reinicializa animações nos novos elementos
        initAnimations();
    } else {
        container.innerHTML = '<div style="width:100%; text-align:center; padding: 2rem;"><p>Nenhum plano encontrado para esta cidade.</p></div>';
    }
}

// === API e Cidade ===
async function fetchData() {
    try {
        const response = await fetch('https://n8nwb.crelo.net/webhook/consultaDesktop', {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('Falha na requisição');

        const data = await response.json();
        appState.apiData = data;
        appState.cities = data.map(item => `${item.CIDADE} - ${item.UF}`);

        // Popula Select
        const select = document.getElementById('citySelect');
        if (select) {
            const currentVal = select.value;
            select.innerHTML = '<option value="">Selecione sua cidade</option>';

            appState.cities.forEach(cityStr => {
                const opt = document.createElement('option');
                opt.value = cityStr;
                opt.textContent = cityStr;
                select.appendChild(opt);
            });

            // Lógica de default
            const defaultCityName = "São José do Rio Preto";
            const foundCity = data.find(c => c.CIDADE === defaultCityName);

            if (foundCity) {
                if (!currentVal || currentVal.includes("São José")) {
                    select.value = `${foundCity.CIDADE} - ${foundCity.UF}`;
                    updatePlansForCity(foundCity);
                }
            }
        }
    } catch (err) {
        console.error("Erro API (usando defaultData):", err);
    }
}

function handleCityChange(fullCityStr) {
    if (!fullCityStr) {
        updatePlansForCity(defaultData);
        return;
    }

    const cityName = fullCityStr.split(' - ')[0].trim();

    // Busca insensível a case/espaços e mais segura
    const cityData = appState.apiData.find(c => {
        const apiCity = String(c.CIDADE || '').trim();
        return apiCity.toLowerCase() === cityName.toLowerCase();
    });

    if (cityData) {
        console.log(`Cidade carregada: ${cityData.CIDADE}`);
        updatePlansForCity(cityData);
        const heroH2 = document.querySelector('.hero-title h2');
        if (heroH2) heroH2.textContent = `Planos Desktop ${cityData.CIDADE}`;
    } else {
        console.warn(`Cidade não encontrada: ${cityName}. Usando dados padrão.`);
        updatePlansForCity(defaultData);
    }
}

// === Modal Logic (Mantida) ===
function initModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('btnClose');
    const btnNovoPlano = document.getElementById('btnNovoPlano');
    const btnSouCliente = document.getElementById('btnSouCliente');

    // Funções globais para abrir/fechar
    window.openPlanModal = function () {
        if (modalOverlay) {
            modalOverlay.style.display = 'flex';
            setTimeout(() => modalOverlay.classList.add('active'), 10);
        }
    };

    window.closePlanModal = function () {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            setTimeout(() => modalOverlay.style.display = 'none', 300);
        }
    };

    if (closeBtn) closeBtn.onclick = window.closePlanModal;
    if (modalOverlay) {
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) window.closePlanModal();
        };
    }

    // Ações dos botões internos do modal
    if (btnNovoPlano) {
        btnNovoPlano.onclick = () => {
            sendLeadToWebhook();
            openInNewTab(buildEliderLink());
        };
    }
    if (btnSouCliente) {
        btnSouCliente.onclick = () => {
            openInNewTab("https://wa.me/551935143100");
        };
    }
}

// === Link Building & Webhook Helpers ===
function getGclidOrFallback() {
    const params = new URLSearchParams(window.location.search);
    return params.get("gclid") || "qZ4R";
}

function buildEliderLink() {
    const code = getGclidOrFallback();
    const text = "Ol%C3%A1,%20meu%20c%C3%B3digo%20%C3%A9%20@" + encodeURIComponent(code) + "%20_(n%C3%A3o%20apague%20essa%20mensagem,%20pois%20ele%20ser%C3%A1%20necess%C3%A1ria%20para%20identificarmos%20a%20sua%20solicita%C3%A7%C3%A3o)_";
    return "https://wa.me/551940421001?text=" + text;
}

function sendLeadToWebhook() {
    const payload = {
        pageUrl: window.location.href,
        timestamp: new Date().toISOString()
    };
    const body = JSON.stringify(payload);

    try {
        if (navigator.sendBeacon) {
            const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
            const ok = navigator.sendBeacon(LEAD_WEBHOOK_URL, blob);
            if (ok) return;
        }
    } catch (_) { }

    try {
        fetch(LEAD_WEBHOOK_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body,
            keepalive: true
        }).catch(() => { });
    } catch (_) { }
}

function openInNewTab(url) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
}

// === Animação Scroll ===
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.plan-card, .advantage-card').forEach(el => {
        el.classList.add('scroll-fade');
        observer.observe(el);
    });
}

// === Boot ===
document.addEventListener('DOMContentLoaded', () => {
    // Footer Year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initModal();
    initAnimations();

    // Select Change
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            handleCityChange(e.target.value);
        });
    }

    // Modal Triggers
    document.querySelectorAll('.open-modal-btn').forEach(btn => {
        if (!btn.closest('.plan-card')) {
            btn.addEventListener('click', () => window.openPlanModal());
        }
    });

    // 1. RENDERIZA IMEDIATO (RÁPIDO)
    updatePlansForCity(defaultData);

    // 2. BUSCA DADOS EM BACKGROUND
    fetchData();
});

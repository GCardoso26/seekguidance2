#!/usr/bin/env python3
"""Fluxograma Visio do Painel do Vendedor — leitura para investidor.

Fonte de UI: /vendedor/painel (seller-sidebar-nav.ts + VendedorPainelClientLayout).
Stencil: Judge_doc.vsdx em /tmp/visio_vsdx.
Não inventa módulos comingSoon nem liquidez (LPC=0).
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_onboarding_visio import (  # noqa: E402
    OUT_DIR,
    Edge,
    Node,
    Page,
    col,
    drawio_xml,
    html_preview,
    write_vsdx,
)


def build_pages() -> list[Page]:
    pages: list[Page] = []

    pages.append(
        Page(
            "Legenda",
            "Legenda",
            13.2,
            8.6,
            [
                Node("l0", "Início / Fim", "start", 2.2, 7.5, 2.3, 0.5),
                Node("l1", "Capacidade do produto", "process", 5.1, 7.5, 2.6, 0.55),
                Node("l2", "Detalhe em outra página", "sub", 8.1, 7.5, 2.6, 0.55),
                Node("l3", "Decisão / gate", "decision", 11.0, 7.5, 2.2, 0.7),
                Node("l4", "Dado interno (SQL)", "data", 2.2, 6.3, 2.6, 0.65),
                Node("l5", "Parceiro (Stripe, PIX…)", "ext", 5.4, 6.3, 2.6, 0.65),
                Node("l6", "Painel do vendedor\nUI no ar · API Render fora", "note", 9.2, 6.3, 4.0, 0.75),
            ],
            [],
        )
    )

    # Tese para investidor
    n = [
        Node("t0", "Investidor: o que este painel é", "start", 6.6, 10.8, 3.2, 0.55),
        Node(
            "t1",
            "JudgeTCG = marketplace TCG BR\n+ loja CNPJ na oferta (não CPF-seller)",
            "process",
            6.6,
            9.5,
            3.6,
            0.8,
        ),
        Node(
            "t2",
            "Painel /vendedor/painel\nferramenta da loja para publicar oferta\ne cumprir pedido sem a equipe no meio",
            "process",
            6.6,
            8.1,
            3.8,
            0.85,
        ),
        Node(
            "t3",
            "Métrica que importa: LPC\noferta × procura sem intervenção humana",
            "decision",
            6.6,
            6.6,
            3.4,
            0.85,
        ),
        Node("t4", "LPC hoje = 0\nBeta não iniciado", "note", 3.0, 5.2, 2.6, 0.7),
        Node(
            "t5",
            "UI Vercel no ar\nFastAPI/Render fora — KPIs podem ser mock",
            "note",
            10.2,
            5.2,
            3.2,
            0.75,
        ),
        Node("t6", "Mapa de módulos", "sub", 6.6, 3.8, 2.6, 0.6, "Mapa módulos"),
    ]
    e = [
        Edge("t0", "t1"),
        Edge("t1", "t2"),
        Edge("t2", "t3"),
        Edge("t3", "t4", "honestidade"),
        Edge("t3", "t5", "runtime 2026-09"),
        Edge("t3", "t6", "capacidades"),
    ]
    pages.append(Page("Tese investidor", "Tese investidor", 14.0, 12.0, n, e))

    # Gates de entrada (screenshot: banner + empty store)
    n, e = col(
        3.4,
        12.2,
        0.95,
        [
            ("g0", "Lojista abre /vendedor/painel", "start"),
            ("g1", "Login Supabase\n/entrar se anônimo", "ext"),
            ("g2", "GET /api/account/status\nKYC merchant", "ext"),
            ("g3", "Status da conta leu?", "decision"),
        ],
    )
    n += [
        Node(
            "g4",
            "Banner vermelho\nStatus indisponível\nO painel permanece disponível",
            "process",
            7.2,
            9.35,
            2.8,
            0.9,
        ),
        Node("g5", "KYC bloqueia publicar?\n/loja/suspensa", "decision", 3.4, 7.4, 2.6, 0.8),
        Node("g6", "GET /api/stores/mine\nHá loja cadastrada?", "decision", 3.4, 6.1, 2.6, 0.8),
        Node("g7", "Empty state\nCadastrar loja", "sub", 7.2, 6.1, 2.5, 0.7, "Cadastrar loja"),
        Node("g8", "Dashboard com KPIs", "sub", 3.4, 4.8, 2.5, 0.6, "Mapa módulos"),
        Node(
            "g9",
            "Fail-open 12s: painel abre\nmesmo se auth/KYC atrasar",
            "note",
            7.2,
            4.8,
            2.8,
            0.75,
        ),
        Node("g10", "Fim entrada", "end", 3.4, 3.5, 2.2, 0.5),
    ]
    e += [
        Edge("g3", "g4", "Não (503 API)", "#e51400"),
        Edge("g3", "g5", "Sim", "#75d175"),
        Edge("g4", "g6"),
        Edge("g5", "g6", "pode publicar"),
        Edge("g6", "g7", "Não", "#e51400"),
        Edge("g6", "g8", "Sim", "#75d175"),
        Edge("g8", "g10"),
        Edge("g7", "g10"),
    ]
    pages.append(Page("Entrada e gates", "Entrada e gates", 12.0, 13.4, n, e))

    # Mapa de módulos (sidebar do print)
    n = [
        Node("m0", "Painel do vendedor", "start", 7.0, 12.4, 2.6, 0.5),
        Node("m1", "Dashboard · Operação · Inbox", "process", 2.6, 11.0, 2.8, 0.7),
        Node("m2", "Insights (plano analytics)", "process", 6.0, 11.0, 2.6, 0.7),
        Node("m3", "Anúncios + Novo anúncio", "sub", 9.4, 11.0, 2.6, 0.7, "Publicar oferta"),
        Node("m4", "Catálogo\ncartas · produtos · expansões · jogos", "process", 2.6, 9.4, 2.8, 0.8),
        Node("m5", "Estoque + import CSV", "process", 6.0, 9.4, 2.6, 0.7),
        Node("m6", "Pedidos (pipeline)\nbadge = pendentes de pagamento", "sub", 9.4, 9.4, 2.8, 0.8, "Pedido ao $"),
        Node("m7", "Clientes (lista / CRM plano)", "process", 2.6, 7.8, 2.8, 0.7),
        Node("m8", "Atendimento tickets\nbadge = tickets abertos", "process", 6.0, 7.8, 2.6, 0.75),
        Node("m9", "Financeiro\nreceitas · repasses · Stripe · PIX", "sub", 9.4, 7.8, 2.8, 0.8, "Pedido ao $"),
        Node("m10", "Marketing: cupons · buylist · ingressos", "process", 2.6, 6.2, 2.9, 0.75),
        Node("m11", "Reputação + Estatísticas", "process", 6.0, 6.2, 2.6, 0.7),
        Node("m12", "Equipe + Configurações + PDV", "process", 9.4, 6.2, 2.8, 0.75),
        Node("m13", "Ver loja pública  ·  Voltar ao site", "process", 6.0, 4.7, 3.2, 0.65),
        Node(
            "m14",
            "Ocultos (comingSoon): chat, CRM avançado,\nreclamações, promoções, movimentações",
            "note",
            6.0,
            3.4,
            4.0,
            0.75,
        ),
        Node("m15", "Valor: a loja opera o ciclo sozinha", "end", 6.0, 2.1, 3.2, 0.55),
    ]
    e = [
        Edge("m0", "m1"),
        Edge("m0", "m2"),
        Edge("m0", "m3"),
        Edge("m0", "m4"),
        Edge("m0", "m5"),
        Edge("m0", "m6"),
        Edge("m4", "m3", "publica"),
        Edge("m5", "m6", "atende pedido"),
        Edge("m6", "m9", "repassa $"),
        Edge("m0", "m7"),
        Edge("m0", "m8"),
        Edge("m0", "m10"),
        Edge("m0", "m11"),
        Edge("m0", "m12"),
        Edge("m0", "m13"),
        Edge("m13", "m15"),
    ]
    pages.append(Page("Mapa módulos", "Mapa módulos", 13.4, 13.8, n, e))

    # Cadastrar loja (honest dual path)
    n, e = col(
        3.3,
        11.4,
        0.95,
        [
            ("c0", "CTA Cadastrar loja", "start"),
            ("c1", "Empty state do dashboard\n(sem GET /api/stores/mine)", "process"),
            ("c2", "Para onde o botão leva?", "decision"),
        ],
    )
    n += [
        Node(
            "c3",
            "/vendedor/painel/onboarding\nStripe Connect\nNÃO cria a loja",
            "ext",
            7.0,
            8.55,
            2.8,
            0.9,
        ),
        Node(
            "c4",
            "/stores/create\nPOST /api/stores\ncria a loja de verdade",
            "data",
            3.3,
            6.6,
            2.7,
            0.85,
        ),
        Node("c5", "Configurações / pagamentos", "process", 3.3, 5.4, 2.6, 0.65),
        Node(
            "c6",
            "Investidor: onboarding de oferta\n= entidade loja + CNPJ + Connect",
            "note",
            7.0,
            5.4,
            2.9,
            0.8,
        ),
        Node("c7", "Loja pronta para anunciar", "end", 3.3, 4.2, 2.4, 0.55),
    ]
    e += [
        Edge("c2", "c3", "atalho empty state"),
        Edge("c2", "c4", "cadastro real"),
        Edge("c4", "c5"),
        Edge("c3", "c5", "se já houver loja"),
        Edge("c5", "c7"),
    ]
    pages.append(Page("Cadastrar loja", "Cadastrar loja", 11.6, 12.6, n, e))

    # Publicar oferta
    n, e = col(
        3.3,
        12.0,
        0.92,
        [
            ("p0", "+ Novo anúncio", "start"),
            ("p1", "Header → catálogo/cartas\n(?action=new ainda não abre wizard)", "process"),
            ("p2", "Caminho completo:\n/listagens/nova", "process"),
            ("p3", "Busca carta no catálogo master", "ext"),
            ("p4", "POST /api/seller/listings", "data"),
            ("p5", "Limite de plano / KYC?", "decision"),
        ],
    )
    n += [
        Node("p6", "Anúncio no ar\noferta visível ao buyer", "end", 3.3, 5.5, 2.5, 0.65),
        Node("p7", "Bloqueio /loja/suspensa\nou upsell /planos", "end", 7.0, 6.5, 2.6, 0.7),
        Node(
            "p8",
            "Sem FastAPI: listagens 503\nCatálogo pode degradar com mock",
            "note",
            7.0,
            5.3,
            2.7,
            0.75,
        ),
    ]
    e += [
        Edge("p5", "p6", "ok", "#75d175"),
        Edge("p5", "p7", "não", "#e51400"),
    ]
    pages.append(Page("Publicar oferta", "Publicar oferta", 11.4, 13.2, n, e))

    # Pedido ao dinheiro
    n = [
        Node("d0", "Buyer paga no marketplace", "start", 3.2, 11.6, 2.5, 0.55),
        Node("d1", "Pedido entra no pipeline", "process", 3.2, 10.4, 2.5, 0.6),
        Node("d2", "Aguardando pagamento → Pago", "process", 3.2, 9.2, 2.6, 0.6),
        Node("d3", "Separação → Enviado → Entregue", "process", 3.2, 8.0, 2.6, 0.65),
        Node("d4", "Tickets se houver disputa", "process", 6.6, 8.0, 2.4, 0.65),
        Node("d5", "Stripe / PIX / Connect", "ext", 3.2, 6.6, 2.5, 0.65),
        Node("d6", "Repasses ao lojista", "ext", 6.6, 6.6, 2.4, 0.6),
        Node("d7", "Chargeback / reconciliação", "process", 9.8, 6.6, 2.5, 0.7),
        Node(
            "d8",
            "LPC: este ciclo sem a equipe JudgeTCG",
            "note",
            6.6,
            5.2,
            3.0,
            0.7,
        ),
        Node("d9", "Dinheiro na loja", "end", 3.2, 5.2, 2.2, 0.5),
        Node(
            "d10",
            "Badges 12 / 3 no print:\nmock se overview API falhar",
            "note",
            9.8,
            8.0,
            2.5,
            0.75,
        ),
    ]
    e = [
        Edge("d0", "d1"),
        Edge("d1", "d2"),
        Edge("d2", "d3"),
        Edge("d3", "d4", "suporte"),
        Edge("d3", "d5"),
        Edge("d5", "d6"),
        Edge("d6", "d7"),
        Edge("d6", "d9"),
        Edge("d8", "d9"),
    ]
    pages.append(Page("Pedido ao $", "Pedido ao $", 13.4, 12.8, n, e))

    # Due diligence / o que está no ar
    n = [
        Node("v0", "Due diligence — o que está no ar", "start", 6.8, 10.6, 3.4, 0.55),
        Node(
            "v1",
            "Pronto na UI (Vercel)\nshell, nav, empty states, wizard, PDV, cupons…",
            "process",
            3.2,
            8.8,
            3.2,
            0.85,
        ),
        Node(
            "v2",
            "Precisa FastAPI + Postgres\nlistagens, pedidos, estoque, stats",
            "ext",
            7.0,
            8.8,
            3.0,
            0.85,
        ),
        Node(
            "v3",
            "Degrada com mock\ndashboard, financeiro, tickets, reputação",
            "note",
            10.8,
            8.8,
            3.0,
            0.85,
        ),
        Node(
            "v4",
            "Não está no menu (comingSoon)\nchat · CRM · promoções · movimentações",
            "process",
            3.2,
            7.0,
            3.2,
            0.8,
        ),
        Node(
            "v5",
            "Não vender como liquidez:\nseed ≠ loja; mock ≠ pedido real",
            "decision",
            7.0,
            7.0,
            3.0,
            0.8,
        ),
        Node(
            "v6",
            "Decisão de orçamento:\n1 runtime FastAPI + API_PROXY_TARGET",
            "note",
            10.8,
            7.0,
            3.0,
            0.8,
        ),
        Node("v7", "Tese intacta: software de loja TCG\npara fechar LPC com CNPJ", "end", 7.0, 5.4, 3.4, 0.7),
    ]
    e = [
        Edge("v0", "v1"),
        Edge("v0", "v2"),
        Edge("v0", "v3"),
        Edge("v1", "v5"),
        Edge("v2", "v5"),
        Edge("v3", "v5"),
        Edge("v4", "v5"),
        Edge("v6", "v7"),
        Edge("v5", "v7", "seguir com evidência"),
    ]
    pages.append(Page("Due diligence", "Due diligence", 14.6, 11.8, n, e))
    return pages


def write_xlsx(dest: Path) -> None:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter
    from openpyxl.worksheet.table import Table, TableStyleInfo

    wb = Workbook()
    fill = PatternFill("solid", fgColor="1B4F72")
    font = Font(color="FFFFFF", bold=True)

    ws = wb.active
    ws.title = "Modulos_Investidor"
    headers = [
        "Módulo (menu)",
        "Rota",
        "O que o investidor deve entender",
        "Status no código",
        "Sem FastAPI/Render",
    ]
    ws.append(headers)
    rows = [
        ("Dashboard", "/vendedor/painel", "Centro da operação da loja", "UI live", "KPIs mock; empty se stores/mine 503"),
        ("Operação", "/vendedor/painel/operacao", "Filas: pedidos, tickets, chargebacks", "UI live", "mock se overview cair"),
        ("Inbox", "/vendedor/painel/inbox", "Alertas operacionais unificados", "UI live", "mock"),
        ("Insights", "/vendedor/painel/insights", "Sugestões (plano analytics)", "UI + lock plano", "mock / lock"),
        ("Anúncios", "/vendedor/painel/listagens", "CRUD da oferta no marketplace", "UI live", "503 sem mock"),
        ("Catálogo", "/vendedor/painel/catalogo/*", "Master de cartas/produtos/jogos", "UI live", "catálogo pode mock"),
        ("Estoque", "/vendedor/painel/estoque", "ERP: ajuste, CSV, export", "UI live", "503; empty sem loja"),
        ("Pedidos", "/vendedor/painel/pedidos", "Pipeline pago→envio (núcleo LPC)", "UI live", "503; badge 12 é mock"),
        ("Clientes", "/vendedor/painel/clientes/lista", "CRM básico (plano crm)", "UI live", "mock lista"),
        ("Atendimento", "/vendedor/painel/atendimento/tickets", "Tickets da loja", "UI live", "badge 3 é mock"),
        ("Financeiro", "/vendedor/painel/financeiro/*", "Receita, repasse, Stripe, PIX", "UI live", "mock"),
        ("Cupons", "/vendedor/painel/cupons", "Promoção da loja", "UI live", "precisa loja+API"),
        ("Buylist", "/vendedor/painel/buylist", "Loja compra da comunidade", "UI + plano", "precisa loja"),
        ("Ingressos", "/vendedor/painel/ingressos", "Eventos/torneios da loja", "UI + plano", "precisa loja"),
        ("Reputação", "/vendedor/painel/reputacao", "Trust / SLA / reviews", "UI live", "mock"),
        ("Estatísticas", "/vendedor/painel/estatisticas", "Vendas (plano analytics)", "UI live", "503"),
        ("Equipe", "/vendedor/painel/equipe/*", "Papéis e logs da loja", "UI live", "mock usuários"),
        ("Configurações", "/vendedor/painel/configuracoes", "Loja, frete, pagamentos", "UI live", "503 settings"),
        ("PDV", "/vendedor/painel/pdv", "Balcão físico (plano Pro+)", "UI live", "precisa loja+API"),
        ("Cadastrar loja (empty)", "/vendedor/painel/onboarding", "Atalho = Stripe Connect, não cria loja", "UI live", "Connect precisa API"),
        ("Cadastrar loja (real)", "/stores/create", "POST /api/stores cria entidade", "UI live", "precisa API"),
        ("+ Novo anúncio", "/vendedor/painel/listagens/nova", "Wizard de listing", "UI live", "precisa API"),
        ("Chat / CRM / Promoções", "—", "comingSoon: fora do menu", "stub oculto", "não vender"),
    ]
    for r in rows:
        ws.append(list(r))
    for cell in ws[1]:
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(wrap_text=True)
    for i, w in enumerate([28, 42, 48, 22, 38], 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    last = ws.max_row
    tab = Table(displayName="ModulosInvestidor", ref=f"A1:E{last}")
    tab.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True)
    ws.add_table(tab)
    ws.freeze_panes = "A2"

    how = wb.create_sheet("Como_importar_Visio")
    how.append(["Passo", "Ação"])
    for row in [
        ("1", "Abrir JudgeTCG_Painel_Vendedor_Investidor.vsdx no Microsoft Visio."),
        ("2", "Abas: Tese investidor → Entrada e gates → Mapa módulos → fluxos → Due diligence."),
        ("3", "Aba Modulos_Investidor deste Excel: copiar linhas para formas no stencil Fluxograma Básico."),
        ("4", "Não tratar badges 12/3 nem empty state como prova de tração (são mock/API fora)."),
        ("5", "Fonte de UI: frontend/runtime_console_v3/src/lib/seller-sidebar-nav.ts"),
    ]:
        how.append(list(row))
    for cell in how[1]:
        cell.fill = fill
        cell.font = font
    how.column_dimensions["A"].width = 8
    how.column_dimensions["B"].width = 110

    dest.parent.mkdir(parents=True, exist_ok=True)
    wb.save(dest)


def main() -> None:
    pages = build_pages()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    vsdx = OUT_DIR / "JudgeTCG_Painel_Vendedor_Investidor.vsdx"
    write_vsdx(pages, vsdx)
    (OUT_DIR / "JudgeTCG_Painel_Vendedor_Investidor.drawio").write_text(drawio_xml(pages), encoding="utf-8")
    html = html_preview(pages).replace(
        "JudgeTCG — Fluxograma funcional E2E",
        "JudgeTCG — Painel do vendedor (investidor)",
    ).replace(
        "Arquivo MS Visio: docs/architecture/visio/JudgeTCG_Fluxograma_E2E.vsdx",
        "MS Visio: docs/architecture/visio/JudgeTCG_Painel_Vendedor_Investidor.vsdx",
    )
    (OUT_DIR / "JudgeTCG_Painel_Vendedor_Investidor.html").write_text(html, encoding="utf-8")
    xlsx = OUT_DIR / "JudgeTCG_Painel_Vendedor_Investidor.xlsx"
    write_xlsx(xlsx)
    print(f"Wrote {vsdx} ({vsdx.stat().st_size} bytes)")
    print(f"Wrote {xlsx} ({xlsx.stat().st_size} bytes)")
    print(f"Pages: {[p.name for p in pages]}")


if __name__ == "__main__":
    main()

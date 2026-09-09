#!/usr/bin/env python3
"""Gera o fluxograma E2E JudgeTCG (.vsdx + .drawio + HTML) a partir do stencil Visio.

Fontes: Judge_doc.vsdx (masters/ paleta), TCG_Judge_Fluxograma_E2E_Visio.xlsx
e a arquitetura real (BFF Next.js, FastAPI, Postgres/pgvector, Redis, APIs externas).
"""
from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "architecture" / "visio"
TEMPLATE = Path("/tmp/visio_vsdx")
NS = "http://schemas.microsoft.com/office/visio/2012/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

# Masters do Judge_doc.vsdx
M_START, M_DATA, M_DECISION, M_PROCESS = 2, 4, 5, 6
M_CONN, M_ROUND, M_GRAD, M_SUB, M_EXT = 7, 9, 13, 16, 17

MASTER_RELS = [
    (1, "master1.xml"),
    (2, "master2.xml"),
    (3, "master3.xml"),
    (4, "master4.xml"),
    (5, "master5.xml"),
    (6, "master6.xml"),
    (7, "master7.xml"),
    (8, "master8.xml"),
    (9, "master9.xml"),
    (10, "master10.xml"),
]


@dataclass
class Node:
    key: str
    text: str
    kind: str  # start, process, sub, decision, data, ext, end, note
    x: float
    y: float
    w: float = 2.05
    h: float = 0.62
    href: str | None = None


@dataclass
class Edge:
    src: str
    dst: str
    label: str = ""
    color: str = "#1998d6"  # azul; #75d175 sim; #e51400 não


@dataclass
class Page:
    name: str
    name_u: str
    width: float
    height: float
    nodes: list[Node]
    edges: list[Edge]
    notes: list[str] = field(default_factory=list)


def uid() -> str:
    return "{" + str(uuid.uuid4()).upper() + "}"


def master_for(kind: str) -> int:
    return {
        "start": M_START,
        "end": M_START,
        "process": M_PROCESS,
        "sub": M_SUB,
        "decision": M_DECISION,
        "data": M_DATA,
        "ext": M_EXT,
        "note": M_ROUND,
    }[kind]


def name_for(kind: str) -> tuple[str, str]:
    return {
        "start": ("Start/End", "Início/Término"),
        "end": ("Start/End", "Início/Término"),
        "process": ("Process", "Processo"),
        "sub": ("Subprocess", "Subprocesso"),
        "decision": ("Decision", "Decisão"),
        "data": ("Data", "Dados"),
        "ext": ("External Data", "Dados Externos"),
        "note": ("Rounded Rectangle", "Retângulo Arredondado"),
    }[kind]


def shape_xml(sid: int, node: Node) -> str:
    mid = master_for(node.kind)
    nu, nn = name_for(node.kind)
    layer = "0"
    txt = escape(node.text)
    extra = ""
    if node.href:
        extra = (
            f"<Section N='Hyperlink'><Row N='Row_1'>"
            f"<Cell N='Description' V=''/><Cell N='Address' V=''/>"
            f"<Cell N='SubAddress' V='{escape(node.href)}' F='Pages[{escape(node.href)}]!ThePage!PAGENAME()'/>"
            f"<Cell N='ExtraInfo' V=''/><Cell N='Frame' V=''/>"
            f"<Cell N='NewWindow' V='0'/><Cell N='Default' V='0'/>"
            f"<Cell N='Invisible' V='0'/><Cell N='SortKey' V=''/>"
            f"</Row></Section>"
        )
    w = node.w
    h = node.h
    return (
        f"<Shape ID='{sid}' NameU='{nu}.{sid}' Name='{nn}.{sid}' Type='Shape' Master='{mid}'>"
        f"<Cell N='PinX' V='{node.x}'/>"
        f"<Cell N='PinY' V='{node.y}'/>"
        f"<Cell N='Width' V='{w}'/>"
        f"<Cell N='Height' V='{h}'/>"
        f"<Cell N='LocPinX' V='{w/2}'/>"
        f"<Cell N='LocPinY' V='{h/2}'/>"
        f"<Cell N='LayerMember' V='{layer}'/>"
        f"<Cell N='LineWeight' V='0.006944444444444444' U='PT' F='Inh'/>"
        f"<Cell N='LineColor' V='#ffffff' F='Inh'/>"
        f"<Cell N='FillBkgnd' V='#4d4d4d' F='Inh'/>"
        f"{extra}"
        f"<Section N='Character'><Row IX='0'><Cell N='Color' V='#ffffff' F='Inh'/>"
        f"<Cell N='Size' V='0.1111111111111111' U='PT'/></Row></Section>"
        f"<Text><cp IX='0'/>{txt}</Text></Shape>"
    )


def connector_xml(sid: int, src_id: int, dst_id: int, a: Node, b: Node, edge: Edge) -> str:
    bx, by, ex, ey = a.x, a.y - a.h / 2, b.x, b.y + b.h / 2
    # horizontal if same row
    if abs(a.y - b.y) < 0.15:
        bx, by = a.x + a.w / 2, a.y
        ex, ey = b.x - b.w / 2, b.y
    width = ex - bx if abs(ex - bx) > 0.01 else 0.1968503937007874
    height = ey - by
    pinx = (bx + ex) / 2
    piny = (by + ey) / 2
    locx = width / 2
    locy = height / 2
    label = escape(edge.label)
    text = f"<Text>{label}</Text>" if edge.label else "<Text/>"
    return (
        f"<Shape ID='{sid}' NameU='Dynamic connector.{sid}' Name='Conector dinâmico.{sid}' Type='Shape' Master='{M_CONN}'>"
        f"<Cell N='PinX' V='{pinx}' F='Inh'/>"
        f"<Cell N='PinY' V='{piny}' F='Inh'/>"
        f"<Cell N='Width' V='{width}' F='GUARD(EndX-BeginX)'/>"
        f"<Cell N='Height' V='{height}' F='GUARD(EndY-BeginY)'/>"
        f"<Cell N='LocPinX' V='{locx}' F='Inh'/>"
        f"<Cell N='LocPinY' V='{locy}' F='Inh'/>"
        f"<Cell N='BeginX' V='{bx}' F='_WALKGLUE(BegTrigger,EndTrigger,WalkPreference)'/>"
        f"<Cell N='BeginY' V='{by}' F='_WALKGLUE(BegTrigger,EndTrigger,WalkPreference)'/>"
        f"<Cell N='EndX' V='{ex}' F='_WALKGLUE(EndTrigger,BegTrigger,WalkPreference)'/>"
        f"<Cell N='EndY' V='{ey}' F='_WALKGLUE(EndTrigger,BegTrigger,WalkPreference)'/>"
        f"<Cell N='LayerMember' V='1'/>"
        f"<Cell N='WalkPreference' V='3'/>"
        f"<Cell N='BegTrigger' V='2' F='_XFTRIGGER(Sheet.{src_id}!EventXFMod)'/>"
        f"<Cell N='EndTrigger' V='2' F='_XFTRIGGER(Sheet.{dst_id}!EventXFMod)'/>"
        f"<Cell N='LineWeight' V='0.006944444444444444' U='PT' F='Inh'/>"
        f"<Cell N='LineColor' V='{edge.color}' F='Inh'/>"
        f"<Cell N='EndArrow' V='4' F='Inh'/>"
        f"<Cell N='ConFixedCode' V='6'/>"
        f"<Section N='Character'><Row IX='0'><Cell N='Color' V='#1176a7'/><Cell N='Size' V='0.09722222222222222' U='PT'/></Row></Section>"
        f"<Section N='Geometry' IX='0'><Row T='MoveTo' IX='1'/><Row T='LineTo' IX='2'><Cell N='X' V='{width}'/><Cell N='Y' V='{height}'/></Row></Section>"
        f"{text}</Shape>"
    )


def gradient_xml(page_w: float, page_h: float) -> str:
    return (
        f"<Shape ID='1' NameU='Center Gradient' Name='Gradiente Central' Type='Shape' Master='{M_GRAD}'>"
        f"<Cell N='PinX' V='{page_w/2}'/>"
        f"<Cell N='PinY' V='{page_h/2}'/>"
        f"<Cell N='Width' V='{page_w}'/>"
        f"<Cell N='Height' V='{page_h}'/>"
        f"<Cell N='LocPinX' V='{page_w/2}'/>"
        f"<Cell N='LocPinY' V='{page_h/2}'/>"
        f"<Cell N='EventDrop' V='0'/>"
        f"<Cell N='EffectSchemeIndex' V='34'/>"
        f"<Cell N='FillForegnd' V='#79c8ee'/>"
        f"<Cell N='FillBkgnd' V='#d1ecf9'/>"
        f"<Section N='User'><Row N='msvVisioCreated'><Cell N='Value' V='0'/><Cell N='Prompt' V=''/></Row></Section>"
        f"</Shape>"
    )


def page_contents(page: Page) -> tuple[str, dict[str, int]]:
    ids: dict[str, int] = {}
    sid = 2
    parts = [gradient_xml(page.width, page.height)]
    for n in page.nodes:
        ids[n.key] = sid
        parts.append(shape_xml(sid, n))
        sid += 1
    connects = []
    for e in page.edges:
        if e.src not in ids or e.dst not in ids:
            continue
        src, dst = ids[e.src], ids[e.dst]
        a = next(x for x in page.nodes if x.key == e.src)
        b = next(x for x in page.nodes if x.key == e.dst)
        cid = sid
        parts.append(connector_xml(cid, src, dst, a, b, e))
        connects.append(
            f"<Connect FromSheet='{cid}' FromCell='BeginX' FromPart='9' ToSheet='{src}' ToCell='PinY' ToPart='3'/>"
            f"<Connect FromSheet='{cid}' FromCell='EndX' FromPart='12' ToSheet='{dst}' ToCell='PinY' ToPart='3'/>"
        )
        sid += 1
    xml = (
        "<?xml version='1.0' encoding='utf-8' ?>"
        f"<PageContents xmlns='{NS}' xmlns:r='{REL_NS}' xml:space='preserve'>"
        f"<Shapes>{''.join(parts)}</Shapes>"
        f"<Connects>{''.join(connects)}</Connects>"
        "</PageContents>"
    )
    return xml, ids


def page_sheet(page: Page, pid: int, unique: str) -> str:
    return (
        f"<Page ID='{pid}' NameU='{escape(page.name_u)}' IsCustomNameU='1' Name='{escape(page.name)}' IsCustomName='1' "
        f"ViewScale='0.65' ViewCenterX='{page.width/2}' ViewCenterY='{page.height/2}'>"
        f"<PageSheet LineStyle='0' FillStyle='0' TextStyle='0' UniqueID='{unique}'>"
        f"<Cell N='PageWidth' V='{page.width}'/>"
        f"<Cell N='PageHeight' V='{page.height}'/>"
        f"<Cell N='ShdwOffsetX' V='0.1181102362204724'/>"
        f"<Cell N='ShdwOffsetY' V='-0.1181102362204724'/>"
        f"<Cell N='PageScale' V='1' U='IN_F'/>"
        f"<Cell N='DrawingScale' V='1' U='IN_F'/>"
        f"<Cell N='DrawingSizeType' V='0'/>"
        f"<Cell N='DrawingScaleType' V='0'/>"
        f"<Cell N='InhibitSnap' V='0'/>"
        f"<Cell N='UIVisibility' V='0'/>"
        f"<Cell N='PrintPageOrientation' V='2'/>"
        f"<Cell N='PlaceStyle' V='2'/>"
        f"<Cell N='RouteStyle' V='6'/>"
        f"<Cell N='ColorSchemeIndex' V='34'/>"
        f"<Cell N='EffectSchemeIndex' V='34'/>"
        f"<Cell N='ThemeIndex' V='34'/>"
        f"<Section N='Layer'>"
        f"<Row IX='0'><Cell N='Name' V='Fluxograma'/><Cell N='Visible' V='1'/><Cell N='Print' V='1'/><Cell N='NameUniv' V='Flowchart'/></Row>"
        f"<Row IX='1'><Cell N='Name' V='Conector'/><Cell N='Visible' V='1'/><Cell N='Print' V='1'/><Cell N='NameUniv' V='Connector'/></Row>"
        f"</Section></PageSheet><Rel r:id='rId{pid+1}'/></Page>"
    )


def page_rels() -> str:
    rels = [
        f'<Relationship Id="rId{i}" Type="http://schemas.microsoft.com/visio/2010/relationships/master" Target="../masters/{fn}"/>'
        for i, fn in MASTER_RELS
    ]
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + "".join(rels)
        + "</Relationships>"
    )


def col(x0: float, y_top: float, gap: float, items: list[tuple]) -> tuple[list[Node], list[Edge]]:
    """items: (key, text, kind, href?) sequential top-down."""
    nodes, edges = [], []
    y = y_top
    prev = None
    for it in items:
        key, text, kind = it[0], it[1], it[2]
        href = it[3] if len(it) > 3 else None
        h = 0.55 if kind in ("start", "end") else 0.68
        nodes.append(Node(key, text, kind, x0, y, 2.15, h, href))
        if prev:
            edges.append(Edge(prev, key))
        prev = key
        y -= gap
    return nodes, edges


def build_pages() -> list[Page]:
    pages: list[Page] = []

    # ---- Página-1 (capa = modelo Judge_doc.vsdx do gestor) ----
    n, e = col(
        5.4,
        7.35,
        1.15,
        [
            ("p0", "Início", "start"),
            ("p1", "Acesso hero — judgetcg\nNext.js 15 · Vercel", "process"),
            ("p2", "Validação de API", "sub", "Validação API"),
            ("p3", "Carga API TCG\nGET /v1/games", "ext"),
        ],
    )
    n += [
        Node("p4", "Continua em Início\njornadas do produto", "sub", 8.6, 2.9, 2.4, 0.7, "Início"),
        Node("p5", "Modelo documental\nJudge_doc.vsdx", "note", 2.2, 7.35, 2.3, 0.7),
    ]
    e += [Edge("p3", "p4")]
    pages.append(Page("Página-1", "Página-1", 11.7, 8.5, n, e))

    # ---- Legenda ----
    legend = [
        Node("l1", "Início / Fim", "start", 2.2, 7.4, 2.3, 0.5),
        Node("l2", "Processo (atividade)", "process", 5.0, 7.4, 2.4, 0.55),
        Node("l3", "Subprocesso (página)", "sub", 7.8, 7.4, 2.5, 0.55),
        Node("l4", "Decisão", "decision", 10.6, 7.4, 2.2, 0.7),
        Node("l5", "Dados / SQL interno", "data", 2.2, 6.3, 2.4, 0.6),
        Node("l6", "API / banco externo", "ext", 5.0, 6.3, 2.4, 0.6),
        Node("l7", "JudgeTCG — modelo documental E2E", "note", 8.8, 6.3, 4.0, 0.6),
    ]
    pages.append(
        Page(
            "Legenda",
            "Legenda",
            13.0,
            8.5,
            legend,
            [],
            [
                "Paleta do stencil Fluxograma Básico (Judge_doc.vsdx).",
                "Destinatários: desenvolvedores (rotas, schemas, jobs) e gestores documentais (decisões, sistemas, evidência).",
            ],
        )
    )

    # ---- Início (gestores) ----
    n, e = col(
        3.2,
        10.6,
        1.05,
        [
            ("i0", "Início", "start"),
            ("i1", "Acesso hero — judgetcg.com.br\nNext.js 15 (Vercel)", "process"),
            ("i2", "BFF /api/* e /api/proxy/*\nAPI_PROXY_TARGET", "process"),
            ("i3", "Validação de API", "sub", "Validação API"),
            ("i4", "Carga API TCG\nGET /v1/games · catálogo", "ext"),
            ("i5", "Jornada do usuário", "decision"),
        ],
    )
    n += [
        Node("i6", "Mesa de Regras\nJudge RAG", "sub", 6.2, 5.35, 2.3, 0.7, "Judge RAG"),
        Node("i7", "Marketplace LPC\nOferta CNPJ (ADR-018)", "sub", 6.2, 4.15, 2.4, 0.7, "Marketplace"),
        Node("i8", "Catálogo e fontes\ncartas · selados · acessórios", "sub", 6.2, 2.95, 2.4, 0.75, "Catálogo"),
        Node("i11", "Auth / identidade\nSupabase JWT", "sub", 9.4, 5.35, 2.4, 0.7, "Auth"),
        Node("i12", "Checkout e frete\nStripe · PIX · Melhor Envio", "sub", 9.4, 4.15, 2.5, 0.7, "Checkout"),
        Node("i13", "Ingestão do corpus\nRAG admin", "sub", 9.4, 2.95, 2.4, 0.7, "Ingestão"),
        Node("i9", "Fim / próxima jornada", "end", 3.2, 1.5, 2.2, 0.5),
        Node("i10", "Visão Tudo\ncamadas e sistemas", "sub", 6.2, 1.5, 2.4, 0.55, "Tudo"),
    ]
    e += [
        Edge("i5", "i6", "Regra de jogo"),
        Edge("i5", "i7", "Comprar / vender"),
        Edge("i5", "i8", "Buscar produto"),
        Edge("i5", "i11", "Entrar / loja"),
        Edge("i7", "i12", "Pagar"),
        Edge("i6", "i13", "Corpus"),
        Edge("i6", "i9"),
        Edge("i7", "i9"),
        Edge("i8", "i9"),
        Edge("i11", "i9"),
        Edge("i12", "i9"),
        Edge("i13", "i9"),
        Edge("i5", "i10", "Arquitetura"),
    ]
    pages.append(Page("Início", "Início", 12.8, 11.8, n, e))

    # ---- Validação API ----
    n, e = col(
        3.4,
        10.8,
        0.95,
        [
            ("v0", "Da página Início", "start"),
            ("v1", "Health BFF\nGET /api/health → /v1/health", "process"),
            ("v2", "FastAPI sobe?\nmiddlewares + CORS", "decision"),
        ],
    )
    n += [
        Node("v3", "Retorna dados TCG\nGET /v1/games (14 TCGs)", "ext", 3.4, 7.2, 2.4, 0.75),
        Node("v4", "API_Fallback\nRender cold start / timeout", "ext", 7.0, 8.9, 2.5, 0.7),
        Node("v5", "Fallback ok?", "decision", 7.0, 7.7, 2.2, 0.7),
        Node("v6", "Return error = market off\nErrorBoundary / PageError", "sub", 7.0, 6.4, 2.6, 0.75),
        Node("v7", "Auth fail-closed (prod)\nSupabase JWT / RBAC", "decision", 3.4, 5.9, 2.4, 0.75),
        Node("v8", "Rate limit Redis\nX-Judge-User-Id", "process", 3.4, 4.7, 2.4, 0.65),
        Node("v9", "Rota autenticada\n/runtime/judge/*", "process", 3.4, 3.5, 2.4, 0.65),
        Node("v10", "Volta ao Início", "end", 3.4, 2.3, 2.2, 0.5),
        Node("v11", "Fim (indisponível)", "end", 7.0, 5.2, 2.2, 0.5),
    ]
    e += [
        Edge("v2", "v3", "Sim", "#75d175"),
        Edge("v2", "v4", "Não", "#e51400"),
        Edge("v4", "v5"),
        Edge("v5", "v3", "Sim", "#75d175"),
        Edge("v5", "v6", "Não", "#e51400"),
        Edge("v6", "v11"),
        Edge("v3", "v7"),
        Edge("v7", "v8", "OK", "#75d175"),
        Edge("v7", "v6", "401/403", "#e51400"),
        Edge("v8", "v9"),
        Edge("v9", "v10"),
    ]
    pages.append(Page("Validação API", "Validação API", 11.5, 12.0, n, e))

    # ---- Judge RAG (Excel S01–S99) ----
    n = [
        Node("s01", "S01 Início", "start", 2.4, 16.8, 2.0, 0.45),
        Node("s02", "S02 Usuário envia\npergunta de regra", "process", 2.4, 15.7, 2.2, 0.7),
        Node("s03", "S03 Frontend/BFF\nPOST /api/proxy/runtime/judge/query", "process", 2.4, 14.5, 2.4, 0.75),
        Node("s04", "S04 API recebe\nmiddlewares FastAPI", "process", 2.4, 13.3, 2.2, 0.7),
        Node("s05", "S05 Auth / rate limit\n/ segurança OK?", "decision", 2.4, 12.1, 2.2, 0.75),
        Node("s99", "S99 Fim", "end", 6.8, 12.1, 1.8, 0.45),
        Node("s06", "S06 Endpoint\nRuntime Judge", "process", 2.4, 10.8, 2.2, 0.7),
        Node("s07", "S07 TCG válido?\nGameConfiguration", "decision", 2.4, 9.6, 2.2, 0.75),
        Node("s98", "S98 Erro /\nindisponibilidade", "process", 6.8, 9.6, 2.2, 0.7),
        Node("s08", "S08 Cache semântico\nRedis HIT?", "decision", 2.4, 8.3, 2.2, 0.75),
        Node("s09", "S09 Resposta em cache", "process", 6.8, 8.3, 2.2, 0.65),
        Node("s10", "S10 RagOrchestrator\njogo habilitado?", "decision", 2.4, 7.0, 2.3, 0.75),
        Node("s11", "S11 Interpretar /\nrotear pergunta", "process", 2.4, 5.7, 2.2, 0.7),
        Node("s12", "S12 HybridRetriever", "process", 2.4, 4.5, 2.2, 0.6),
        Node("s13", "S13 Busca vetorial\nPostgres + pgvector", "data", 5.4, 4.5, 2.3, 0.7),
        Node("s14", "S14 Busca lexical\nto_tsvector FTS", "data", 8.2, 4.5, 2.3, 0.7),
        Node("s15", "S15 Há hits?\ncombinar / ranquear", "decision", 2.4, 3.2, 2.2, 0.75),
        Node("s16", "S16 Contexto +\ncitações", "process", 2.4, 2.0, 2.2, 0.7),
        Node("s17", "S17 LLM OpenAI\nchat.completions", "ext", 5.4, 2.0, 2.3, 0.7),
        Node("s18", "S18 Confiança +\nveredito", "process", 8.2, 2.0, 2.2, 0.7),
        Node("s19", "S19 Feedback / métricas", "data", 8.2, 0.85, 2.2, 0.6),
        Node("s20", "S20 Grava cache", "process", 5.4, 0.85, 2.0, 0.55),
        Node("s21", "S21 JSON JudgeQueryResponse", "process", 2.4, 0.85, 2.2, 0.65),
        Node("s97", "S97 UI apresenta\nresposta + fontes", "process", 2.4, -0.3, 2.2, 0.7),
        Node("s99b", "S99 Fim", "end", 2.4, -1.3, 1.8, 0.45),
    ]
    e = [
        Edge("s01", "s02"),
        Edge("s02", "s03", "HTTP"),
        Edge("s03", "s04", "HTTP"),
        Edge("s04", "s05"),
        Edge("s05", "s06", "OK", "#75d175"),
        Edge("s05", "s99", "Bloqueada", "#e51400"),
        Edge("s06", "s07"),
        Edge("s07", "s08", "Jogo válido", "#75d175"),
        Edge("s07", "s98", "Inválido", "#e51400"),
        Edge("s08", "s09", "HIT", "#75d175"),
        Edge("s08", "s10", "MISS"),
        Edge("s09", "s97"),
        Edge("s10", "s11", "Encontrado", "#75d175"),
        Edge("s10", "s98", "Não", "#e51400"),
        Edge("s11", "s12"),
        Edge("s12", "s13", "SQL"),
        Edge("s12", "s14", "SQL"),
        Edge("s13", "s15"),
        Edge("s14", "s15"),
        Edge("s15", "s16", "Há hits", "#75d175"),
        Edge("s15", "s98", "Sem hits", "#e51400"),
        Edge("s16", "s17"),
        Edge("s17", "s18", "Sucesso", "#75d175"),
        Edge("s17", "s98", "Falha", "#e51400"),
        Edge("s18", "s19", "Persistência"),
        Edge("s18", "s20"),
        Edge("s20", "s21", "JSON"),
        Edge("s21", "s97"),
        Edge("s97", "s99b"),
        Edge("s98", "s99b"),
    ]
    pages.append(Page("Judge RAG", "Judge RAG", 11.2, 19.0, n, e))

    # ---- Marketplace ----
    n, e = col(
        3.0,
        12.2,
        0.95,
        [
            ("m0", "Início jornada marketplace", "start"),
            ("m1", "Buyer navega home / PDP\nNext.js RSC", "process"),
            ("m2", "BFF catálogo / listings", "process"),
            ("m3", "Postgres public schema\nlistings · stores · RLS", "data"),
        ],
    )
    n += [
        Node("m4", "Seller CNPJ?\nADR-018 acreditação", "decision", 6.6, 9.4, 2.4, 0.8),
        Node("m5", "Valida CNPJ local\nidentity_platform + companies", "data", 9.6, 9.4, 2.6, 0.8),
        Node("m6", "Checkout Stripe / PIX", "sub", 3.0, 6.6, 2.3, 0.7, "Checkout"),
        Node("m7", "Melhor Envio (frete)\nfreight_quote", "ext", 6.0, 6.6, 2.4, 0.7),
        Node("m8", "Evento LPC\noferta × procura sem intervenção", "process", 3.0, 5.4, 2.5, 0.75),
        Node("m9", "Recusar CPF-seller\npending_accreditation", "process", 6.6, 8.1, 2.5, 0.7),
        Node("m10", "Fim", "end", 3.0, 4.2, 1.8, 0.45),
        Node("m11", "CEP BrasilAPI\nGET /api/geo/cep/[cep]", "ext", 9.6, 8.1, 2.5, 0.7),
    ]
    e += [
        Edge("m3", "m4"),
        Edge("m4", "m5", "Credenciar loja"),
        Edge("m4", "m6", "Buyer compra", "#75d175"),
        Edge("m4", "m9", "Não CNPJ", "#e51400"),
        Edge("m5", "m3", "grava companies"),
        Edge("m1", "m11", "endereço"),
        Edge("m6", "m7"),
        Edge("m6", "m8"),
        Edge("m8", "m10"),
        Edge("m9", "m10"),
    ]
    pages.append(Page("Marketplace", "Marketplace", 13.2, 13.2, n, e))

    # ---- Catálogo ----
    n = [
        Node("c0", "Job / request catálogo", "start", 2.5, 9.5, 2.2, 0.5),
        Node("c1", "Product Catalog Sync\nservices/api product-catalog", "process", 2.5, 8.3, 2.4, 0.75),
        Node("c2", "Tipo de produto?", "decision", 2.5, 7.0, 2.2, 0.7),
        Node("c3", "Cartas\nScryfall · pokemontcg.io\nYGOPRODeck · lorcast · OPTCG", "ext", 5.6, 7.0, 2.6, 0.9),
        Node("c4", "Selados\nTCGCSV → TCGplayer CDN", "ext", 8.6, 7.0, 2.5, 0.8),
        Node("c5", "Acessórios\nShopify · Woo · Shopware · Tray", "ext", 11.5, 7.0, 2.6, 0.85),
        Node("c6", "product_catalog DB\n+ media.assets", "data", 2.5, 5.4, 2.4, 0.7),
        Node("c7", "Meilisearch (opcional)\nbusca de cartas", "ext", 5.6, 5.4, 2.4, 0.7),
        Node("c8", "UI catálogo / PDP\nnext/image hosts", "process", 2.5, 4.1, 2.4, 0.7),
        Node("c9", "Fim", "end", 2.5, 2.9, 1.8, 0.45),
    ]
    e = [
        Edge("c0", "c1"),
        Edge("c1", "c2"),
        Edge("c2", "c3", "single"),
        Edge("c2", "c4", "sealed"),
        Edge("c2", "c5", "accessory"),
        Edge("c3", "c6"),
        Edge("c4", "c6"),
        Edge("c5", "c6"),
        Edge("c6", "c7"),
        Edge("c6", "c8"),
        Edge("c8", "c9"),
    ]
    pages.append(Page("Catálogo", "Catálogo", 14.5, 10.8, n, e))

    # ---- Auth ----
    n, e = col(
        3.2,
        10.4,
        0.95,
        [
            ("a0", "Usuário abre /entrar", "start"),
            ("a1", "Next.js Auth UI\n@supabase/ssr cookies", "process"),
            ("a2", "Supabase Auth\nGoTrue JWT", "ext"),
        ],
    )
    n += [
        Node("a3", "Sessão válida?", "decision", 3.2, 6.6, 2.2, 0.7),
        Node("a4", "BFF encaminha JWT\nAuthorization / cookie", "process", 3.2, 5.4, 2.5, 0.7),
        Node("a5", "FastAPI fail-closed (prod)\nRBAC + X-Judge-User-Id", "process", 3.2, 4.2, 2.6, 0.75),
        Node("a6", "Redis revoke / rate limit", "data", 6.6, 4.2, 2.4, 0.7),
        Node("a7", "Gate de login\nsem keys = UI bloqueada", "process", 6.6, 6.6, 2.5, 0.7),
        Node("a8", "identity_platform\ncompanies · KYC", "data", 3.2, 3.0, 2.4, 0.7),
        Node("a9", "Fim (autenticado)", "end", 3.2, 1.8, 2.1, 0.5),
        Node("a10", "Fim (anônimo)", "end", 6.6, 5.4, 2.1, 0.45),
    ]
    e += [
        Edge("a2", "a3"),
        Edge("a3", "a4", "Sim", "#75d175"),
        Edge("a3", "a7", "Não", "#e51400"),
        Edge("a7", "a10"),
        Edge("a4", "a5"),
        Edge("a5", "a6"),
        Edge("a5", "a8"),
        Edge("a8", "a9"),
    ]
    pages.append(Page("Auth", "Auth", 10.5, 11.5, n, e))

    # ---- Checkout ----
    n, e = col(
        3.0,
        11.2,
        0.92,
        [
            ("k0", "Carrinho / PDP", "start"),
            ("k1", "CheckoutClient\n/checkout", "process"),
            ("k2", "BFF checkout\n→ FastAPI shop_checkout", "process"),
            ("k3", "Reserva crédito / listing\nPostgres public", "data"),
        ],
    )
    n += [
        Node("k4", "Meio de pagamento?", "decision", 3.0, 6.6, 2.3, 0.75),
        Node("k5", "Stripe Checkout\n+ Connect (seller)", "ext", 6.2, 6.6, 2.4, 0.75),
        Node("k6", "PIX (chave loja)", "ext", 9.2, 6.6, 2.2, 0.7),
        Node("k7", "Webhook Stripe\npayment_intent", "ext", 6.2, 5.3, 2.4, 0.7),
        Node("k8", "Cotação Melhor Envio", "ext", 9.2, 5.3, 2.3, 0.7),
        Node("k9", "Pedido / orders\nSQL marketplace", "data", 3.0, 5.3, 2.3, 0.7),
        Node("k10", "LPC possível\nsem intervenção humana", "process", 3.0, 4.0, 2.5, 0.7),
        Node("k11", "Fim", "end", 3.0, 2.8, 1.8, 0.45),
    ]
    e += [
        Edge("k3", "k4"),
        Edge("k4", "k5", "cartão"),
        Edge("k4", "k6", "PIX"),
        Edge("k5", "k7"),
        Edge("k5", "k8", "frete"),
        Edge("k6", "k9"),
        Edge("k7", "k9"),
        Edge("k9", "k10"),
        Edge("k10", "k11"),
    ]
    pages.append(Page("Checkout", "Checkout", 12.4, 12.4, n, e))

    # ---- Ingestão ----
    n, e = col(
        3.2,
        10.6,
        0.95,
        [
            ("g0", "Admin / job ingestão", "start"),
            ("g1", "POST /runtime/admin/ingestion\nworker_main", "process"),
            ("g2", "Documento de regras\nPDF / HTML oficial", "ext"),
        ],
    )
    n += [
        Node("g3", "Chunking + metadados\nGameConfiguration", "process", 3.2, 6.8, 2.5, 0.75),
        Node("g4", "Embeddings OpenAI", "ext", 6.6, 6.8, 2.3, 0.7),
        Node("g5", "INSERT documents/chunks\ntcg_judge + pgvector", "data", 3.2, 5.5, 2.6, 0.8),
        Node("g6", "FTS to_tsvector", "data", 6.6, 5.5, 2.3, 0.7),
        Node("g7", "Corpus utilizável\nno Judge RAG", "sub", 3.2, 4.2, 2.4, 0.7, "Judge RAG"),
        Node("g8", "Fim", "end", 3.2, 3.0, 1.8, 0.45),
    ]
    e += [
        Edge("g2", "g3"),
        Edge("g3", "g4"),
        Edge("g4", "g5"),
        Edge("g5", "g6"),
        Edge("g5", "g7"),
        Edge("g7", "g8"),
    ]
    pages.append(Page("Ingestão", "Ingestão", 10.5, 11.5, n, e))

    # ---- Tudo ----
    n = [
        Node("t0", "Cliente web\nlocalhost:3000 / Vercel", "process", 2.4, 10.2, 2.4, 0.75),
        Node("t1", "BFF Next\n/api/bff /api/proxy /api/games", "process", 5.2, 10.2, 2.5, 0.75),
        Node("t2", "FastAPI :8000\n46 routers /runtime /v1 /public", "process", 8.1, 10.2, 2.6, 0.75),
        Node("t3", "Supabase Auth\nJWT fail-closed prod", "ext", 11.0, 10.2, 2.4, 0.75),
        Node("t4", "Postgres tcg_judge\nchunks · documents · pgvector", "data", 2.4, 8.4, 2.5, 0.8),
        Node("t5", "Postgres public\nmarketplace · stores · RLS", "data", 5.2, 8.4, 2.5, 0.8),
        Node("t6", "Redis\ncache · rate limit · revoke", "data", 8.1, 8.4, 2.5, 0.8),
        Node("t7", "OpenAI\nembeddings + chat", "ext", 11.0, 8.4, 2.4, 0.8),
        Node("t8", "Stripe / PIX / Connect", "ext", 2.4, 6.6, 2.4, 0.7),
        Node("t9", "BrasilAPI CEP", "ext", 5.2, 6.6, 2.3, 0.7),
        Node("t10", "APIs TCG cartas", "ext", 8.1, 6.6, 2.3, 0.7),
        Node("t11", "TCGCSV / Shopify…", "ext", 11.0, 6.6, 2.4, 0.7),
        Node("t12", "Worker jobs\ningestão · catalog.sync", "sub", 2.4, 4.9, 2.4, 0.75, "Ingestão"),
        Node("t13", "Render API + Vercel web", "process", 5.2, 4.9, 2.5, 0.75),
        Node("t16", "Melhor Envio", "ext", 8.1, 4.9, 2.3, 0.7),
        Node("t14", "North Star R1 LPC\nliquidez oferta CNPJ", "note", 11.0, 4.9, 2.5, 0.75),
        Node("t15", "Páginas: Página-1 · Início · Validação API · Judge RAG · Marketplace · Catálogo · Auth · Checkout · Ingestão", "end", 7.0, 3.3, 7.0, 0.6),
    ]
    e = [
        Edge("t0", "t1", "HTTPS"),
        Edge("t1", "t2", "HTTP"),
        Edge("t2", "t3"),
        Edge("t2", "t4", "SQL"),
        Edge("t2", "t5", "SQL"),
        Edge("t2", "t6"),
        Edge("t2", "t7"),
        Edge("t2", "t8"),
        Edge("t2", "t9"),
        Edge("t2", "t10"),
        Edge("t2", "t11"),
        Edge("t2", "t16"),
        Edge("t12", "t2"),
        Edge("t12", "t4"),
        Edge("t13", "t0"),
        Edge("t13", "t2"),
    ]
    pages.append(Page("Tudo", "Tudo", 14.4, 11.6, n, e))
    return pages


DRAW_COLORS = {
    "start": ("#e89ab8", "#5a1f35"),
    "end": ("#e89ab8", "#5a1f35"),
    "process": ("#7eb8da", "#123044"),
    "sub": ("#7dbe7d", "#143214"),
    "decision": ("#e89ab8", "#5a1f35"),
    "data": ("#e8a05c", "#3d2a12"),
    "ext": ("#d9894a", "#3d2a12"),
    "note": ("#f2f2f2", "#333333"),
}


def drawio_xml(pages: list[Page]) -> str:
    diagrams = []
    for pi, page in enumerate(pages):
        cells = [
            '<mxCell id="0"/>',
            '<mxCell id="1" parent="0"/>',
        ]
        key_id = {}
        cid = 2
        for n in page.nodes:
            key_id[n.key] = cid
            fill, font = DRAW_COLORS[n.kind]
            style = (
                f"rounded=1;whiteSpace=wrap;html=1;fillColor={fill};fontColor={font};"
                f"strokeColor=#ffffff;fontSize=11;align=center;"
            )
            if n.kind == "decision":
                style = f"rhombus;whiteSpace=wrap;html=1;fillColor={fill};fontColor={font};strokeColor=#ffffff;fontSize=11;"
            elif n.kind in ("start", "end"):
                style = f"ellipse;whiteSpace=wrap;html=1;fillColor={fill};fontColor={font};strokeColor=#ffffff;fontSize=11;"
            elif n.kind == "data":
                style = f"parallelogram;whiteSpace=wrap;html=1;fillColor={fill};fontColor={font};strokeColor=#ffffff;fontSize=11;"
            elif n.kind == "ext":
                style = f"cylinder3;whiteSpace=wrap;html=1;fillColor={fill};fontColor={font};strokeColor=#ffffff;fontSize=11;size=10;"
            elif n.kind == "sub":
                style = (
                    f"rounded=0;whiteSpace=wrap;html=1;fillColor={fill};fontColor={font};"
                    "strokeColor=#ffffff;fontSize=11;shape=partialRectangle;left=1;right=1;top=0;bottom=0;"
                )
            # Visio Y up → draw.io Y down
            x = int(n.x * 90)
            y = int((page.height - n.y) * 90)
            w = int(n.w * 90)
            h = int(n.h * 90)
            label = html.escape(n.text).replace("\n", "&#xa;")
            cells.append(
                f'<mxCell id="{cid}" value="{label}" style="{style}" vertex="1" parent="1">'
                f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
            )
            cid += 1
        for e in page.edges:
            if e.src not in key_id or e.dst not in key_id:
                continue
            lbl = html.escape(e.label)
            cells.append(
                f'<mxCell id="{cid}" value="{lbl}" style="endArrow=block;html=1;strokeColor={e.color};fontSize=10;" '
                f'edge="1" parent="1" source="{key_id[e.src]}" target="{key_id[e.dst]}">'
                f'<mxGeometry relative="1" as="geometry"/></mxCell>'
            )
            cid += 1
        diagrams.append(
            f'<diagram id="p{pi}" name="{html.escape(page.name)}">'
            f'<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
            f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="{int(page.width*96)}" pageHeight="{int(page.height*96)}" math="0" shadow="0">'
            f'<root>{"".join(cells)}</root></mxGraphModel></diagram>'
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<mxfile host="app.diagrams.net" type="device">'
        + "".join(diagrams)
        + "</mxfile>"
    )


def html_preview(pages: list[Page]) -> str:
    css = """
    body{font-family:Segoe UI,system-ui,sans-serif;background:#0f1720;color:#e8eef4;margin:0}
    header{padding:24px 32px;border-bottom:1px solid #2a3b4d}
    h1{margin:0 0 6px;font-size:22px}
    .sub{opacity:.8;font-size:14px}
    section{padding:28px 32px;border-bottom:1px solid #22303d}
    h2{margin:0 0 16px;font-size:18px;color:#7eb8da}
    .flow{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch}
    .col{display:flex;flex-direction:column;gap:8px;min-width:180px}
    .box{border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.35;white-space:pre-line;color:#102018}
    .start,.end{background:#e89ab8;border-radius:999px;text-align:center}
    .process{background:#7eb8da}
    .sub{background:#7dbe7d}
    .decision{background:#e89ab8;transform:none;text-align:center}
    .data{background:#e8a05c}
    .ext{background:#d9894a}
    .note{background:#eef3f7}
    .arrow{text-align:center;color:#7eb8da;font-size:18px}
    table{border-collapse:collapse;width:100%;font-size:13px}
    td,th{border:1px solid #2a3b4d;padding:8px 10px;text-align:left}
    th{background:#1a2733}
    """
    parts = [
        "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='utf-8'/>",
        "<title>JudgeTCG — Fluxograma E2E</title>",
        f"<style>{css}</style></head><body>",
        "<header><h1>JudgeTCG — Fluxograma funcional E2E</h1>",
        "<p class='sub'>Modelo Visio (Judge_doc.vsdx) + planilha E2E + arquitetura do repositório. "
        "Arquivo MS Visio: docs/architecture/visio/JudgeTCG_Fluxograma_E2E.vsdx</p></header>",
        "<section><h2>Legenda de formas</h2><table><tr><th>Forma</th><th>Uso</th><th>Público</th></tr>",
        "<tr><td>Início/Fim (rosa)</td><td>Terminador</td><td>Gestores e devs</td></tr>",
        "<tr><td>Processo (azul)</td><td>Atividade da plataforma</td><td>Ambos</td></tr>",
        "<tr><td>Subprocesso (verde)</td><td>Detalhe em outra página</td><td>Ambos</td></tr>",
        "<tr><td>Decisão (losango rosa)</td><td>Regra de negócio / gate</td><td>Gestores</td></tr>",
        "<tr><td>Dados (laranja)</td><td>SQL Postgres / Redis</td><td>Devs</td></tr>",
        "<tr><td>Dados externos (laranja)</td><td>OpenAI, Scryfall, Stripe, BrasilAPI…</td><td>Ambos</td></tr>",
        "</table></section>",
    ]
    for page in pages:
        parts.append(f"<section><h2>Página Visio: {html.escape(page.name)}</h2><div class='flow'>")
        # group roughly by x
        cols: dict[float, list[Node]] = {}
        for n in page.nodes:
            k = round(n.x, 1)
            cols.setdefault(k, []).append(n)
        for k in sorted(cols):
            parts.append("<div class='col'>")
            nodes = sorted(cols[k], key=lambda z: -z.y)
            for i, n in enumerate(nodes):
                txt = html.escape(n.text)
                parts.append(f"<div class='box {n.kind}'>{txt}</div>")
                if i < len(nodes) - 1:
                    parts.append("<div class='arrow'>↓</div>")
            parts.append("</div>")
        parts.append("</div></section>")
    parts.append("</body></html>")
    return "".join(parts)


def write_vsdx(pages: list[Page], dest: Path) -> None:
    if not TEMPLATE.exists():
        raise SystemExit(f"Template Visio não extraído em {TEMPLATE}")
    work = Path("/tmp/judgetcg_vsdx_build")
    if work.exists():
        shutil.rmtree(work)
    shutil.copytree(TEMPLATE, work)
    pages_dir = work / "visio" / "pages"
    rels_dir = pages_dir / "_rels"
    # remove old page xml (keep structure)
    for p in pages_dir.glob("page*.xml"):
        p.unlink()

    page_elems = []
    ct_overrides = []
    rels_pages = []
    titles = []
    for i, page in enumerate(pages):
        pid = i
        fname = f"page{i+1}.xml"
        unique = uid()
        xml, _ = page_contents(page)
        (pages_dir / fname).write_text(xml, encoding="utf-8")
        (rels_dir / f"{fname}.rels").write_text(page_rels(), encoding="utf-8")
        page_elems.append(page_sheet(page, pid, unique))
        rels_pages.append(
            f'<Relationship Id="rId{i+1}" Type="http://schemas.microsoft.com/visio/2010/relationships/page" Target="{fname}"/>'
        )
        ct_overrides.append(
            f'<Override PartName="/visio/pages/{fname}" ContentType="application/vnd.ms-visio.page+xml"/>'
        )
        titles.append(page.name)

    pages_xml = (
        f"<?xml version='1.0' encoding='utf-8' ?>"
        f"<Pages xmlns='{NS}' xmlns:r='{REL_NS}' xml:space='preserve'>"
        + "".join(page_elems)
        + "</Pages>"
    )
    (pages_dir / "pages.xml").write_text(pages_xml, encoding="utf-8")
    (rels_dir / "pages.xml.rels").write_text(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + "".join(rels_pages)
        + "</Relationships>",
        encoding="utf-8",
    )

    # Content_Types: keep masters + replace pages
    types = work / "[Content_Types].xml"
    base = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Default Extension="emf" ContentType="image/x-emf"/>
<Override PartName="/visio/document.xml" ContentType="application/vnd.ms-visio.drawing.main+xml"/>
<Override PartName="/visio/masters/masters.xml" ContentType="application/vnd.ms-visio.masters+xml"/>
"""
    masters_ct = "".join(
        f'<Override PartName="/visio/masters/master{i}.xml" ContentType="application/vnd.ms-visio.master+xml"/>'
        for i in range(1, 11)
    )
    rest = """<Override PartName="/visio/pages/pages.xml" ContentType="application/vnd.ms-visio.pages+xml"/>
<Override PartName="/visio/windows.xml" ContentType="application/vnd.ms-visio.windows+xml"/>
<Override PartName="/visio/validation.xml" ContentType="application/vnd.ms-visio.validation+xml"/>
<Override PartName="/visio/comments.xml" ContentType="application/vnd.ms-visio.comments+xml"/>
<Override PartName="/visio/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
<Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/>
</Types>"""
    types.write_text(base + masters_ct + "".join(ct_overrides) + rest, encoding="utf-8")

    n = len(pages)
    titles_xml = "".join(f"<vt:lpstr>{escape(t)}</vt:lpstr>" for t in titles)
    masters_titles = (
        "<vt:lpstr>Início/Término</vt:lpstr><vt:lpstr>Dados</vt:lpstr><vt:lpstr>Decisão</vt:lpstr>"
        "<vt:lpstr>Processo</vt:lpstr><vt:lpstr>Conector dinâmico</vt:lpstr>"
        "<vt:lpstr>Retângulo Arredondado</vt:lpstr><vt:lpstr>Gradiente Central</vt:lpstr>"
        "<vt:lpstr>Subprocesso</vt:lpstr><vt:lpstr>Dados Externos</vt:lpstr>"
        "<vt:lpstr>Referência fora da página</vt:lpstr>"
    )
    app = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Template>VERTICALFLOWCHART_M.vstx</Template><Application>Microsoft Visio</Application>
<HeadingPairs><vt:vector size="4" baseType="variant">
<vt:variant><vt:lpstr>Páginas</vt:lpstr></vt:variant><vt:variant><vt:i4>{n}</vt:i4></vt:variant>
<vt:variant><vt:lpstr>Mestres</vt:lpstr></vt:variant><vt:variant><vt:i4>10</vt:i4></vt:variant>
</vt:vector></HeadingPairs>
<TitlesOfParts><vt:vector size="{n+10}" baseType="lpstr">{titles_xml}{masters_titles}</vt:vector></TitlesOfParts>
<AppVersion>16.0000</AppVersion>
</Properties>"""
    (work / "docProps" / "app.xml").write_text(app, encoding="utf-8")
    core = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>JudgeTCG Fluxograma E2E</dc:title>
<dc:subject>Arquitetura funcional API, banco e dados externos</dc:subject>
<dc:creator>JudgeTCG Platform Guardian</dc:creator>
<cp:lastModifiedBy>JudgeTCG</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-09-09T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-09-09T00:00:00Z</dcterms:modified>
</cp:coreProperties>"""
    (work / "docProps" / "core.xml").write_text(core, encoding="utf-8")

    doc = (work / "visio" / "document.xml").read_text(encoding="utf-8")
    doc = doc.replace("TopPage='9'", "TopPage='0'")
    (work / "visio" / "document.xml").write_text(doc, encoding="utf-8")
    win = (work / "visio" / "windows.xml").read_text(encoding="utf-8")
    win = win.replace("Page='9'", "Page='0'")
    (work / "visio" / "windows.xml").write_text(win, encoding="utf-8")

    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        dest.unlink()
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
        for f in work.rglob("*"):
            if f.is_file():
                z.write(f, f.relative_to(work).as_posix())


def main() -> None:
    pages = build_pages()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    vsdx = OUT_DIR / "JudgeTCG_Fluxograma_E2E.vsdx"
    write_vsdx(pages, vsdx)
    (OUT_DIR / "JudgeTCG_Fluxograma_E2E.drawio").write_text(drawio_xml(pages), encoding="utf-8")
    (OUT_DIR / "JudgeTCG_Fluxograma_E2E.html").write_text(html_preview(pages), encoding="utf-8")
    print(f"Wrote {vsdx} ({vsdx.stat().st_size} bytes)")
    print(f"Pages: {[p.name for p in pages]}")


if __name__ == "__main__":
    main()

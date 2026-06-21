# TCG-Judge: Plano de Arquitetura e Melhorias Estratégicas
## Sistema Integrado de Marketplace, Torneios e Certificação de Juízes para TCGs

---

## 1. DIAGNÓSTICO DO MERCADO (Baseado nos Documentos Anexados)

### 1.1 Falhas Críticas do MyP Cards

| Problema | Impacto | Oportunidade para TCG-Judge |
|----------|---------|----------------------------|
| Interface datada e pouco intuitiva | Alta fricção para novos usuários | Design moderno, mobile-first, com UX baseada em padrões de e-commerce contemporâneos |
| Nota 6.27/10 no Reclame Aqui | Perda de confiança do consumidor | Sistema de suporte com SLA de 4h, chat ao vivo e mediação automatizada |
| 63.6% de reclamações resolvidas | Um terço dos clientes insatisfeitos | Pipeline de resolução com 5 etapas, tracking transparente e recompensas por resolução |
| Tempo médio de resposta: 14 dias | Frustração extrema dos usuários | Resposta em até 4h (suporte), 24h (mediação), 48h (disputas complexas) |
| Taxa de saque R$ 9,90 (usuário padrão) | Barreira para vendedores casuais | Saque gratuito para todos os níveis, comissão competitiva de 5% fixa |
| Dependência exclusiva dos Correios | Atrasos logísticos frequentes | Multi-carrier: Correios, Jadlog, Loggi, Azul Cargo com cálculo automático de frete |
| Ausência de app mobile nativo | Perda de engajamento mobile | App nativo iOS/Android com scanner de cartas, notificações push e gestão de pedidos |
| Sem sistema de juízes/certificação | Disputas resolvidas de forma amadora | Sistema de Juízes Certificados com prova online, níveis e recompensas |

### 1.2 Falhas Críticas da Liga Lorcana

| Problema | Impacto | Oportunidade para TCG-Judge |
|----------|---------|----------------------------|
| Presença digital fragmentada (múltiplos sites) | Confusão para novos jogadores | Plataforma unificada: marketplace + torneios + rankings + coleções em um único domínio |
| Sites protegidos por Cloudflare | Baixa indexação em buscadores | SEO otimizado, sitemap dinâmico, schema.org para cards e eventos |
| Ausência de marketplace integrado | Jogadores precisam sair da plataforma para comprar/vender | Marketplace nativo com escrow, integração logística e proteção anti-fraude |
| Dependência de ferramentas de terceiros | Fragilidade e inconsistência de dados | Soluções proprietárias: scanner nativo, deck builder integrado, ranking próprio |
| Modelo de receita não transparente | Dificuldade de sustentabilidade | Modelo híbrido: comissão de marketplace + taxa de inscrição em torneios + planos premium |
| Sem app mobile nativo | Engajamento limitado | App com scanner, deck builder, inscrição em torneios e notificações em tempo real |
| Sem API pública | Limitação de inovação por terceiros | API RESTful completa, webhooks, SDKs para Python, JS, Flutter |

### 1.3 Benchmarking de Comissões (Oportunidade de Diferenciação)

```
MyP Cards (Padrão):     7% -> 1% (escalonado por volume)
MyP Cards (Máx. Desc.): 1% (acima de R$ 80k/mês)
Liga Pokémon:           10% -> 15%
Cardmarket:             5%
Mercado Livre:          16%

-> TCG-Judge Proposta:   5% FIXA (todos os vendedores) + 0% para juízes certificados
```

**Vantagem competitiva:** Comissão fixa de 5% é mais atrativa que o padrão de 7% do MyP Cards e igual ao Cardmarket, mas com logística nacional e suporte local. Vendedores certificados e juízes pagam 0% de comissão (incentivo à qualidade).

---

## 2. ARQUITETURA DO SISTEMA TCG-JUDGE

### 2.1 Visão Geral da Plataforma

O TCG-Judge é uma plataforma **vertical integrada** que combina:

1. **Marketplace P2P** (compra/venda de cartas com escrow e proteção)
2. **Sistema de Torneios** (organização, inscrição, brackets, rankings)
3. **Certificação de Juízes** (provas online, níveis, atribuição a eventos)
4. **Gestão de Coleções** (scanner, deck builder, rastreamento de valor)
5. **Comunidade** (fóruns, chat, perfis de jogador, estatísticas)

### 2.2 Stack Tecnológico Recomendado

**FRONTEND LAYER**
- Web App (Next.js 14 + Tailwind + shadcn/ui)
- Mobile App (Flutter 3.x)
- Admin Dashboard (React + Ant Design Pro)

**API GATEWAY**
- Kong ou AWS API Gateway
- Rate limiting, autenticação, logging

**MICROSERVICES**
- Auth Service (Go + Gin)
- Marketplace Service (Node.js + NestJS)
- Tournament Service (Node.js + NestJS)
- Judge Certification Service (Python + FastAPI)
- Collection Service (Node.js + NestJS)
- Payment Service (Go + Stripe/Pix)
- Logistics Service (Node.js + Multi-carrier APIs)
- Notification Service (Node.js + Firebase/SNS)

**DATA LAYER**
- PostgreSQL 16 (dados transacionais)
- Redis 7 (cache, sessões, rate limit)
- Elasticsearch 8 (busca de cards, listagens)
- Qdrant (RAG, embeddings visuais para scanner)
- ClickHouse (analytics, métricas de negócio)
- Kafka (eventos entre serviços)
- S3/MinIO (imagens, PDFs, evidências)

**EXTERNAL INTEGRATIONS**
- Pagamento: Stripe, Asaas (PIX), Pagar.me
- Logística: Correios (SIGEP), Jadlog, Loggi, Azul Cargo
- IA: OpenAI GPT-4 (chatbot suporte), Google Vision (OCR scanner)
- Dados: TCGdex API (Pokémon), Scryfall API (MTG), YGOPRODECK (Yu-Gi-Oh!)
- Comunicação: Twilio (WhatsApp/SMS), SendGrid (Email), Firebase (Push)
- Streaming: Twitch API, YouTube Live API

### 2.3 Modelo de Dados Principal (SQL)

```sql
-- Usuários com roles múltiplos
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    cpf_cnpj VARCHAR(18) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    reputation_score DECIMAL(3,2) DEFAULT 5.00,
    total_sales INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    kyc_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ
);

-- Roles: buyer, seller, certified_seller, store, judge_l1, judge_l2, judge_l3, admin, moderator
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role)
);

-- Catálogo de Cartas (universal, multi-TCG)
CREATE TABLE card_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    publisher VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    official_website VARCHAR(500),
    rulebook_url VARCHAR(500)
);

CREATE TABLE card_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES card_games(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL,
    release_date DATE,
    total_cards INTEGER,
    set_symbol_url VARCHAR(500),
    UNIQUE(game_id, code)
);

CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID REFERENCES card_sets(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    number VARCHAR(20) NOT NULL,
    rarity VARCHAR(50),
    card_type VARCHAR(100),
    mana_cost VARCHAR(50),
    energy_type VARCHAR(50),
    ink_cost VARCHAR(50),
    description TEXT,
    image_url VARCHAR(500),
    image_back_url VARCHAR(500),
    tcgplayer_id VARCHAR(50),
    scryfall_id VARCHAR(50),
    ygoprodeck_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(set_id, number)
);

-- Marketplace - Listagens
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('NM', 'LP', 'MP', 'HP', 'DMG')),
    language VARCHAR(10) DEFAULT 'PT',
    is_foil BOOLEAN DEFAULT FALSE,
    is_alternate_art BOOLEAN DEFAULT FALSE,
    is_promo BOOLEAN DEFAULT FALSE,
    is_graded BOOLEAN DEFAULT FALSE,
    grading_company VARCHAR(50),
    grading_score DECIMAL(3,1),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    description TEXT,
    images TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'paused', 'removed', 'under_review')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    views INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0,
    is_authenticated_by_judge BOOLEAN DEFAULT FALSE,
    authenticated_by UUID REFERENCES users(id),
    fraud_risk_score INTEGER DEFAULT 0
);

-- Pedidos com Escrow
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending_payment' 
        CHECK (status IN ('pending_payment', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed', 'refunded')),
    total_items DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_provider VARCHAR(50),
    shipping_service VARCHAR(50),
    tracking_code VARCHAR(50),
    shipping_label_url VARCHAR(500),
    estimated_delivery DATE,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    escrow_released_at TIMESTAMPTZ,
    dispute_id UUID,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    condition_verified VARCHAR(20),
    is_authenticated BOOLEAN DEFAULT FALSE,
    authentication_judge_id UUID REFERENCES users(id)
);

-- Sistema de Torneios
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES card_games(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    format VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('swiss', 'single_elimination', 'double_elimination', 'round_robin', 'league')),
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open_registration', 'in_progress', 'completed', 'cancelled')),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    registration_fee DECIMAL(10,2) DEFAULT 0,
    prize_pool JSONB DEFAULT '{}',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location_type VARCHAR(20) DEFAULT 'online' CHECK (location_type IN ('online', 'physical', 'hybrid')),
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    stream_url VARCHAR(500),
    rules TEXT,
    requires_decklist BOOLEAN DEFAULT FALSE,
    decklist_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deck_list JSONB,
    decklist_validated BOOLEAN DEFAULT FALSE,
    decklist_validation_errors JSONB,
    registration_paid BOOLEAN DEFAULT FALSE,
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_at TIMESTAMPTZ,
    final_rank INTEGER,
    points INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

CREATE TABLE tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    table_number INTEGER,
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    player1_wins INTEGER DEFAULT 0,
    player2_wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    winner_id UUID REFERENCES users(id),
    is_bye BOOLEAN DEFAULT FALSE,
    judge_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'disputed')),
    notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(tournament_id, round, match_number)
);

-- Sistema de Juízes Certificados
CREATE TABLE judge_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES card_games(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'revoked', 'expired')),
    certified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    exam_score DECIMAL(5,2),
    total_events INTEGER DEFAULT 0,
    total_rulings INTEGER DEFAULT 0,
    total_disputes_resolved INTEGER DEFAULT 0,
    reputation_score DECIMAL(3,2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, game_id, level)
);

CREATE TABLE judge_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES card_games(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER NOT NULL,
    passing_score DECIMAL(5,2) NOT NULL,
    questions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE judge_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES judge_exams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB,
    score DECIMAL(5,2),
    passed BOOLEAN,
    anti_cheat_flags JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sistema de Disputas e Mediação
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    initiator_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('item_not_received', 'wrong_item', 'damaged', 'fake', 'condition_mismatch', 'other')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'escalated', 'closed')),
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    assigned_judge_id UUID REFERENCES users(id),
    resolution TEXT,
    resolution_type VARCHAR(20) CHECK (resolution_type IN ('refund_full', 'refund_partial', 'replacement', 'rejected', 'escalated')),
    refund_amount DECIMAL(10,2),
    sla_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    attachments TEXT[],
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rankings e Estatísticas
CREATE TABLE player_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES card_games(id) ON DELETE CASCADE,
    format VARCHAR(50) NOT NULL,
    season VARCHAR(20) NOT NULL,
    elo_rating INTEGER DEFAULT 1000,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_drawn INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    tournament_points INTEGER DEFAULT 0,
    tournaments_played INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    best_result VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, game_id, format, season)
);

-- Coleções de Usuários
CREATE TABLE user_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(20),
    is_foil BOOLEAN DEFAULT FALSE,
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    acquired_at DATE,
    is_for_sale BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(10,2),
    listing_id UUID REFERENCES listings(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, card_id, condition, is_foil)
);

-- Wishlist / Alertas de Preço
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    condition VARCHAR(20),
    is_foil BOOLEAN DEFAULT FALSE,
    target_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_card ON listings(card_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_tournaments_game ON tournaments(game_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_date ON tournaments(start_date);
CREATE INDEX idx_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_rankings_user ON player_rankings(user_id);
CREATE INDEX idx_rankings_game ON player_rankings(game_id);
CREATE INDEX idx_collections_user ON user_collections(user_id);
CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_disputes_judge ON disputes(assigned_judge_id);
```

---

## 3. MELHORIAS ESTRATÉGICAS POR MÓDULO

### 3.1 Módulo: Marketplace (Superando MyP Cards)

#### 3.1.1 Comissão Competitiva
- **TCG-Judge:** 5% fixa para todos os vendedores (vs 7% padrão do MyP)
- **Incentivo Juízes:** 0% comissão para vendedores com certificação de juiz ativa
- **Sem taxa de saque:** Saque gratuito para todas as categorias (vs R$ 9,90 do MyP)
- **Sem mensalidade:** Todos os recursos disponíveis sem custo fixo

#### 3.1.2 Multi-Carrier de Logística

Integração com múltiplas transportadoras:
- Correios (SIGEPWeb): PAC, SEDEX, SEDEX 10
- Jadlog: Expresso, .Package
- Loggi: SameDay, Express
- Azul Cargo: AzulExpress

Funcionalidade: Cálculo automático de frete comparativo, retornando opções ordenadas por preço e prazo.

#### 3.1.3 Scanner de Cartas com IA (Diferencial)

Pipeline de reconhecimento:
1. Pré-processamento da imagem
2. Detecção de card na imagem (YOLO)
3. OCR para extrair texto (Google Vision)
4. Embedding visual para matching (CLIP)
5. Busca híbrida: texto + visual (Qdrant)
6. Estimativa de condição da carta
7. Retorno: card_id, confiança, condição, preço de mercado

#### 3.1.4 Sistema de Escrow Aprimorado

Estados do pedido:
1. PENDING_PAYMENT -> Pagamento confirmado
2. PAID -> Vendedor notificado para envio (24h SLA)
3. SHIPPED -> Comprador pode rastrear
4. DELIVERED -> 48h para confirmação ou disputa
5. COMPLETED -> Fundos liberados ao vendedor
6. DISPUTED -> Juiz atribuído para mediação (4h SLA)

#### 3.1.5 Proteção Anti-Fraud e Autenticação

Sistema de detecção de fraudes em tempo real:
- Preço anormalmente baixo (possível fake): +40 risk score
- Vendedor novo com item de alto valor: +30 risk score
- Múltiplas listagens idênticas (possível bot): +20 risk score
- Risk score > 50: Requer autenticação por juiz

### 3.2 Módulo: Sistema de Juízes (Diferencial Único)

#### 3.2.1 Níveis de Certificação

| Nível | Requisitos | Permissões | Benefícios |
|-------|-----------|------------|------------|
| L0 - Candidato | Conta verificada, KYC completo | Estudar material, fazer simulados | Acesso à base de conhecimento |
| L1 - Juiz Floor | Prova online 70%+, 3 meses de conta | Julgar eventos locais (<32 players), mediação de disputas | 0% comissão em vendas, badge |
| L2 - Juiz Regional | 10 eventos como L1, prova L2 75%+, entrevista | Julgar eventos regionais (32-128), treinar L1 | Destaque em busca, prioridade em disputas |
| L3 - Juiz Nacional | 20 eventos como L2, prova L3 80%+, recomendação | Julgar nacionais (128+), head judge, suspender L1/L2 | Receita de eventos, acesso antecipado |

#### 3.2.2 Prova Online Gamificada

- Geração de prova aleatória com 30 questões
- Categorias: rules, policy, interactions, penalties
- Anti-cheat: verificação de tempo entre respostas, padrões suspeitos
- Notificação automática para comunidade ao passar

#### 3.2.3 Mediação de Disputas por Juízes

Algoritmo de matching de juiz:
- Especializado no mesmo TCG da disputa
- Nível mínimo conforme complexidade
- Round-robin: atribui ao juiz com menos disputas ativas (máx 3)
- SLA: 4h para primeira resposta

Decisões possíveis:
- REFUND_FULL: Reembolso total ao comprador
- REFUND_PARTIAL: Reembolso parcial (acordo)
- REPLACEMENT: Vendedor envia item correto
- REJECTED: Disputa rejeitada, fundos ao vendedor
- ESCALATE: Escalar para juiz de nível superior

### 3.3 Módulo: Torneios (Superando Liga Lorcana)

#### 3.3.1 Sistema Unificado (vs Fragmentação da Liga)

Formatos suportados:
- Swiss (Suíço)
- Single Elimination (Eliminação Simples)
- Double Elimination (Eliminação Dupla)
- Round Robin (Todos contra todos)
- League (Liga Lorcana style)

Funcionalidades:
- Geração automática de brackets
- Pairing suíço com algoritmo de matching (ELO, evitar rematches)
- Notificação push para jogadores
- Integração com streaming (Twitch/YouTube)

#### 3.3.2 Deck List Registration com Validação

Validação automática conforme regras oficiais:
- Quantidade mínima/máxima de cards
- Limite de cópias por card
- Cards banidos/restritos
- Formato de commander (se aplicável)

#### 3.3.3 Ranking ELO com Cross-Game

Fórmula ELO com K-factor dinâmico:
- K-factor ajustado por número de partidas e elo atual
- Atualização automática após cada partida
- Leaderboard global por jogo e formato
- Histórico de temporada

### 3.4 Módulo: Coleções e Deck Builder

#### 3.4.1 Scanner de Cartas com IA

Pipeline completo:
1. Detecção de card na imagem
2. OCR para extrair nome, número, símbolo do set
3. Matching com banco de dados (fuzzy + embeddings visuais)
4. Estimativa de condição (NM, LP, MP, HP, DMG)
5. Preço de mercado atual

#### 3.4.2 Deck Builder Inteligente

Sugestões de cards baseado em:
- Sinergia com cards existentes no deck
- Popularidade no meta atual (últimos 30 dias)
- Disponibilidade no mercado (preço)
- Cards que o usuário já possui na coleção

---

## 4. MELHORIAS DE EXPERIÊNCIA DO USUÁRIO (UX)

### 4.1 Interface Moderna e Mobile-First

| Aspecto | MyP Cards (atual) | TCG-Judge (proposto) |
|---------|-------------------|----------------------|
| Design | Datado, anos 2010 | Moderno, Tailwind CSS |
| Responsividade | Não responsivo | Mobile-first, PWA |
| App Nativo | Não existe | Flutter iOS/Android |
| Busca | Filtros básicos | Busca semântica + Elasticsearch |
| Carregamento | Lento | Skeleton + lazy loading |
| Dark Mode | Não existe | Nativo |
| Notificações | Apenas email | Push + WhatsApp + Email |

### 4.2 Sistema de Suporte com SLA

SLAs definidos:
- General Inquiry: 4h resposta, 24h resolução
- Dispute Open: 1h resposta, 48h resolução
- Judge Assigned: 4h resposta, 72h resolução
- Fraud Report: 30min resposta, 12h resolução
- Payment Issue: 2h resposta, 24h resolução

**vs MyP Cards (14 dias de resposta média):** Redução de 98% no tempo de resposta.

### 4.3 Gamificação e Engajamento

Badges para Compradores:
- Primeira Compra (🛒)
- Colecionador (📚) - 100 cards
- Comprador Confiável (⭐) - 50 compras sem disputa
- Baleia (🐋) - R$ 10k em compras

Badges para Vendedores:
- Primeira Venda (💰)
- Power Seller (⚡) - 100 vendas
- Avaliação Perfeita (💎) - 4.9+ estrelas
- Envio Rápido (🚀) - 95% envio em 24h

Badges para Jogadores:
- Estreante (🎯)
- Top 8 (🏆)
- Campeão (👑)
- Juiz L1 (⚖️)

---

## 5. MODELO DE NEGÓCIO E RECEITA

### 5.1 Fontes de Receita

| Fonte | Descrição | % da Receita Estimada |
|-------|-----------|----------------------|
| Comissão Marketplace | 5% sobre vendas | 60% |
| Taxa de Inscrição em Torneios | R$ 5-50 por evento | 15% |
| Planos Premium | Vendedores: destaque, analytics, API | 10% |
| Serviço de Autenticação | Juiz autentica carta de alto valor | 8% |
| Publicidade | Lojas patrocinadas, banners | 5% |
| API/White-label | Lojas físicas usam plataforma | 2% |

### 5.2 Planos Premium

| Plano | Preço | Benefícios |
|-------|-------|-----------|
| Free | R$ 0 | Marketplace básico, torneios, coleções |
| Seller Pro | R$ 29/mês | Destaque em busca, analytics, multi-estoque, API básica |
| Store | R$ 99/mês | Domínio próprio, PDV, integração ERP, suporte prioritário |
| Tournament Organizer | R$ 49/evento | Ferramentas avançadas de torneio, streaming, juízes inclusos |

---

## 6. ROTEIRO DE IMPLEMENTAÇÃO (MVP -> Full)

### Fase 1: MVP (Mês 1-3) - "Marketplace + Juízes L1"
- Cadastro de usuários e KYC
- Catálogo de cards (MTG, Pokémon, Lorcana, Yu-Gi-Oh!)
- Marketplace com escrow básico
- Sistema de provas para Juiz L1
- Disputas com atribuição automática de juiz
- Pagamento via PIX e cartão
- Integração Correios

### Fase 2: Expansão (Mês 4-6) - "Torneios + Mobile"
- Sistema de torneios (suíço, eliminatória)
- App mobile Flutter (scanner, deck builder)
- Rankings ELO
- Multi-carrier (Jadlog, Loggi)
- Notificações push/WhatsApp
- Juiz L2 e L3

### Fase 3: Escala (Mês 7-9) - "Comunidade + API"
- Fóruns e comunidades por jogo
- API pública para desenvolvedores
- SDKs (Python, JS, Flutter)
- Integração com TCGdex/Scryfall
- Sistema de autenticação de cartas
- White-label para lojas físicas

### Fase 4: Consolidação (Mês 10-12) - "Ecossistema"
- Streaming integrado (Twitch/YouTube)
- Patrocínios e parcerias oficiais
- Expansão para 19+ TCGs
- Internacionalização (PT/EN/ES)
- Blockchain para certificação de autenticidade

---

## 7. MÉTRICAS DE SUCESSO vs CONCORRENTES

| Métrica | MyP Cards | Liga Lorcana | TCG-Judge (Meta) |
|---------|-----------|--------------|------------------|
| Comissão | 7% -> 1% | N/A | **5% fixa** |
| Taxa de Saque | R$ 9,90 | N/A | **Grátis** |
| Tempo Resposta Suporte | 14 dias | N/A | **4h** |
| Resolução de Disputas | 63.6% | N/A | **95%** |
| Tempo Resolução Disputa | Dias | N/A | **48h** |
| App Mobile | Não | Não | **Sim iOS/Android** |
| Torneios Integrados | Não | Sim (fragmentado) | **Sim Unificado** |
| Juízes Certificados | Não | Não | **Sim 3 Níveis** |
| Multi-Carrier | Não | Não | **Sim 4+ transportadoras** |
| Scanner de Cartas | Não | Não (terceiro) | **Sim Nativo com IA** |
| API Pública | Não | Não | **Sim RESTful** |
| Dark Mode | Não | Não | **Sim** |
| Notificações Push | Não | Não | **Sim** |

---

## 8. CONCLUSÃO

O TCG-Judge posiciona-se como a **primeira plataforma integrada** do mercado brasileiro de TCGs, combinando:

1. **Marketplace** com comissão competitiva (5%), escrow seguro e multi-carrier
2. **Sistema de Juízes** certificados que resolve disputas em 48h (vs 14 dias do MyP)
3. **Torneios** unificados com rankings ELO, brackets automáticos e streaming
4. **Coleções** com scanner de IA, deck builder e alertas de preço
5. **Comunidade** gamificada com badges, fóruns e perfis de jogador

**Diferencial competitivo chave:** Nenhuma plataforma atual no Brasil oferece a combinação de marketplace + torneios + certificação de juízes. O MyP Cards é apenas marketplace com suporte deficiente. A Liga Lorcana é apenas torneios sem comércio. O TCG-Judge é o **"super app" do TCG brasileiro**.

---

*Documento gerado com base na análise dos documentos de pesquisa de mercado anexados.*
*Data: 21 de Junho de 2026*

"""
TCG-Judge: Sistema de Certificação de Juízes
============================================
Módulo diferencial que nenhum concorrente possui.
Resolve disputas em 48h (vs 14 dias do MyP Cards).
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
import json
import asyncio
from decimal import Decimal


class JudgeLevel(Enum):
    L0_CANDIDATE = 0
    L1_FLOOR = 1
    L2_REGIONAL = 2
    L3_NATIONAL = 3


class CertificationStatus(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"
    EXPIRED = "expired"


class DisputeType(Enum):
    ITEM_NOT_RECEIVED = "item_not_received"
    WRONG_ITEM = "wrong_item"
    DAMAGED = "damaged"
    FAKE = "fake"
    CONDITION_MISMATCH = "condition_mismatch"
    OTHER = "other"


class DisputeStatus(Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    CLOSED = "closed"


class ResolutionType(Enum):
    REFUND_FULL = "refund_full"
    REFUND_PARTIAL = "refund_partial"
    REPLACEMENT = "replacement"
    REJECTED = "rejected"
    ESCALATED = "escalated"


@dataclass
class User:
    id: UUID = field(default_factory=uuid4)
    email: str = ""
    display_name: str = ""
    cpf_cnpj: str = ""
    phone: str = ""
    is_active: bool = True
    reputation_score: Decimal = Decimal("5.00")
    kyc_verified: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    roles: List[str] = field(default_factory=list)


@dataclass
class JudgeCertification:
    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    game_id: UUID = field(default_factory=uuid4)
    level: JudgeLevel = JudgeLevel.L0_CANDIDATE
    status: CertificationStatus = CertificationStatus.PENDING
    certified_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    exam_score: Optional[Decimal] = None
    total_events: int = 0
    total_rulings: int = 0
    total_disputes_resolved: int = 0
    reputation_score: Decimal = Decimal("5.00")
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class JudgeExam:
    id: UUID = field(default_factory=uuid4)
    game_id: UUID = field(default_factory=uuid4)
    level: JudgeLevel = JudgeLevel.L1_FLOOR
    title: str = ""
    description: str = ""
    time_limit_minutes: int = 45
    passing_score: Decimal = Decimal("70.00")
    questions: List[Dict[str, Any]] = field(default_factory=list)
    is_active: bool = True


@dataclass
class JudgeExamAttempt:
    id: UUID = field(default_factory=uuid4)
    exam_id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    answers: List[int] = field(default_factory=list)
    score: Optional[Decimal] = None
    passed: Optional[bool] = None
    anti_cheat_flags: List[str] = field(default_factory=list)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    ip_address: str = ""


@dataclass
class Dispute:
    id: UUID = field(default_factory=uuid4)
    order_id: UUID = field(default_factory=uuid4)
    initiator_id: UUID = field(default_factory=uuid4)
    type: DisputeType = DisputeType.OTHER
    status: DisputeStatus = DisputeStatus.OPEN
    description: str = ""
    evidence_urls: List[str] = field(default_factory=list)
    assigned_judge_id: Optional[UUID] = None
    resolution: Optional[str] = None
    resolution_type: Optional[ResolutionType] = None
    refund_amount: Optional[Decimal] = None
    sla_deadline: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None


class JudgeCertificationSystem:
    """
    Sistema central de certificação de juízes do TCG-Judge.

    Diferencial competitivo:
    - Juízes certificados resolvem disputas em 48h (vs 14 dias do MyP Cards)
    - 3 níveis de certificação com provas online gamificadas
    - Anti-cheat nas provas
    - Sistema de reputação de juízes
    """

    def __init__(self):
        self.certifications: Dict[UUID, JudgeCertification] = {}
        self.exams: Dict[UUID, JudgeExam] = {}
        self.exam_attempts: Dict[UUID, JudgeExamAttempt] = {}
        self.disputes: Dict[UUID, Dispute] = {}
        self.users: Dict[UUID, User] = {}

        # Configurações por nível
        self.level_config = {
            JudgeLevel.L1_FLOOR: {
                "passing_score": Decimal("70.00"),
                "min_account_age_days": 90,
                "max_simultaneous_disputes": 3,
                "can_judge_events": True,
                "max_event_size": 32,
                "commission_discount": Decimal("0.00")  # 0% comissão
            },
            JudgeLevel.L2_REGIONAL: {
                "passing_score": Decimal("75.00"),
                "min_events_as_l1": 10,
                "max_simultaneous_disputes": 5,
                "can_train_l1": True,
                "max_event_size": 128,
                "commission_discount": Decimal("0.00")
            },
            JudgeLevel.L3_NATIONAL: {
                "passing_score": Decimal("80.00"),
                "min_events_as_l2": 20,
                "max_simultaneous_disputes": 10,
                "can_suspend_l1_l2": True,
                "can_head_judge": True,
                "max_event_size": 999999,
                "commission_discount": Decimal("0.00")
            }
        }

    async def create_exam(self, game_id: UUID, level: JudgeLevel, 
                          title: str, questions: List[Dict[str, Any]]) -> JudgeExam:
        """Cria uma nova prova de certificação."""
        config = self.level_config.get(level, {})
        passing_score = config.get("passing_score", Decimal("70.00"))

        exam = JudgeExam(
            id=uuid4(),
            game_id=game_id,
            level=level,
            title=title,
            time_limit_minutes=45,
            passing_score=passing_score,
            questions=questions
        )
        self.exams[exam.id] = exam
        return exam

    async def start_exam(self, exam_id: UUID, user_id: UUID, 
                         ip_address: str) -> JudgeExamAttempt:
        """Inicia uma tentativa de prova."""
        exam = self.exams.get(exam_id)
        if not exam:
            raise ValueError("Exame não encontrado")

        # Verifica se usuário já tem certificação ativa
        existing = await self.get_active_certification(user_id, exam.game_id, exam.level)
        if existing:
            raise ValueError("Usuário já possui certificação ativa para este nível")

        attempt = JudgeExamAttempt(
            id=uuid4(),
            exam_id=exam_id,
            user_id=user_id,
            started_at=datetime.now(),
            ip_address=ip_address
        )
        self.exam_attempts[attempt.id] = attempt
        return attempt

    async def submit_exam(self, attempt_id: UUID, answers: List[int]) -> Dict[str, Any]:
        """Submete respostas da prova com anti-cheat."""
        attempt = self.exam_attempts.get(attempt_id)
        if not attempt:
            raise ValueError("Tentativa não encontrada")

        exam = self.exams.get(attempt.exam_id)
        if not exam:
            raise ValueError("Exame não encontrado")

        # Anti-cheat checks
        flags = await self._check_anti_cheat(attempt, answers)
        attempt.anti_cheat_flags = flags

        if flags:
            attempt.completed_at = datetime.now()
            attempt.passed = False
            return {
                "status": "UNDER_REVIEW",
                "flags": flags,
                "message": "Sua prova foi flagrada por suspeitas de fraude. Será analisada manualmente."
            }

        # Grade exam
        correct = 0
        for i, answer in enumerate(answers):
            if i < len(exam.questions):
                if answer == exam.questions[i].get("correct_answer"):
                    correct += 1

        score = Decimal(correct) / Decimal(len(exam.questions)) * Decimal("100")
        attempt.score = score
        attempt.passed = score >= exam.passing_score
        attempt.completed_at = datetime.now()

        if attempt.passed:
            await self._grant_certification(attempt.user_id, exam.game_id, exam.level, score)

        return {
            "score": float(score),
            "passed": attempt.passed,
            "required": float(exam.passing_score)
        }

    async def _check_anti_cheat(self, attempt: JudgeExamAttempt, 
                                 answers: List[int]) -> List[str]:
        """Verifica padrões suspeitos nas respostas."""
        flags = []

        # Check 1: Tempo muito rápido (menos de 30 segundos por questão)
        if attempt.started_at:
            elapsed = (datetime.now() - attempt.started_at).total_seconds()
            exam = self.exams.get(attempt.exam_id)
            min_time = len(exam.questions) * 15  # 15 segundos mínimo por questão
            if elapsed < min_time:
                flags.append("TOO_FAST")

        # Check 2: Padrão de respostas suspeito (ex: todas "A")
        if len(set(answers)) == 1 and len(answers) > 5:
            flags.append("SUSPICIOUS_PATTERN")

        # Check 3: Respostas perfeitas em tempo recorde
        exam = self.exams.get(attempt.exam_id)
        correct_count = sum(1 for i, a in enumerate(answers) 
                           if i < len(exam.questions) and a == exam.questions[i].get("correct_answer"))
        if correct_count == len(exam.questions) and elapsed < len(exam.questions) * 30:
            flags.append("PERFECT_SCORE_TOO_FAST")

        return flags

    async def _grant_certification(self, user_id: UUID, game_id: UUID, 
                                    level: JudgeLevel, score: Decimal) -> JudgeCertification:
        """Concede certificação ao usuário."""
        cert = JudgeCertification(
            id=uuid4(),
            user_id=user_id,
            game_id=game_id,
            level=level,
            status=CertificationStatus.ACTIVE,
            certified_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=365),  # 1 ano
            exam_score=score
        )
        self.certifications[cert.id] = cert

        # Atualiza roles do usuário
        user = self.users.get(user_id)
        if user:
            role = f"judge_l{level.value}"
            if role not in user.roles:
                user.roles.append(role)

        return cert

    async def get_active_certification(self, user_id: UUID, game_id: UUID, 
                                        level: JudgeLevel) -> Optional[JudgeCertification]:
        """Busca certificação ativa do usuário."""
        for cert in self.certifications.values():
            if (cert.user_id == user_id and 
                cert.game_id == game_id and 
                cert.level == level and
                cert.status == CertificationStatus.ACTIVE and
                (cert.expires_at is None or cert.expires_at > datetime.now())):
                return cert
        return None

    async def find_best_judge_for_dispute(self, game_id: UUID, 
                                           dispute_type: DisputeType) -> Optional[User]:
        """
        Algoritmo de matching de juiz para disputa.

        Critérios:
        1. Especializado no mesmo TCG
        2. Nível mínimo conforme complexidade
        3. Menor número de disputas ativas (round-robin)
        4. Reputação >= 4.0
        """
        # Define nível mínimo baseado na complexidade da disputa
        min_level = JudgeLevel.L1_FLOOR
        if dispute_type in [DisputeType.FAKE, DisputeType.CONDITION_MISMATCH]:
            min_level = JudgeLevel.L2_REGIONAL

        eligible_judges = []

        for cert in self.certifications.values():
            if (cert.game_id == game_id and 
                cert.level.value >= min_level.value and
                cert.status == CertificationStatus.ACTIVE and
                cert.reputation_score >= Decimal("4.00") and
                (cert.expires_at is None or cert.expires_at > datetime.now())):

                user = self.users.get(cert.user_id)
                if user and user.is_active:
                    # Conta disputas ativas
                    active_disputes = sum(1 for d in self.disputes.values() 
                                         if d.assigned_judge_id == cert.user_id 
                                         and d.status in [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW])

                    config = self.level_config.get(cert.level, {})
                    max_disputes = config.get("max_simultaneous_disputes", 3)

                    if active_disputes < max_disputes:
                        eligible_judges.append({
                            "user": user,
                            "cert": cert,
                            "active_disputes": active_disputes,
                            "level": cert.level
                        })

        if not eligible_judges:
            return None

        # Ordena: nível maior primeiro, depois menos disputas ativas
        eligible_judges.sort(key=lambda x: (-x["level"].value, x["active_disputes"]))

        return eligible_judges[0]["user"]

    async def create_dispute(self, order_id: UUID, initiator_id: UUID, 
                              dispute_type: DisputeType, description: str,
                              evidence_urls: List[str]) -> Dispute:
        """Cria uma nova disputa e atribui juiz automaticamente."""
        dispute = Dispute(
            id=uuid4(),
            order_id=order_id,
            initiator_id=initiator_id,
            type=dispute_type,
            description=description,
            evidence_urls=evidence_urls,
            created_at=datetime.now(),
            sla_deadline=datetime.now() + timedelta(hours=48)  # 48h SLA
        )

        # Atribui juiz automaticamente (game_id seria obtido do order)
        # Aqui simulamos com um game_id fixo para exemplo
        game_id = uuid4()  # Em produção, obtido do order
        judge = await self.find_best_judge_for_dispute(game_id, dispute_type)

        if judge:
            dispute.assigned_judge_id = judge.id
            dispute.status = DisputeStatus.UNDER_REVIEW

        self.disputes[dispute.id] = dispute
        return dispute

    async def judge_decision(self, dispute_id: UUID, judge_id: UUID, 
                              resolution_type: ResolutionType, 
                              resolution: str,
                              refund_amount: Optional[Decimal] = None) -> Dispute:
        """Juiz toma decisão na disputa."""
        dispute = self.disputes.get(dispute_id)
        if not dispute:
            raise ValueError("Disputa não encontrada")

        if dispute.assigned_judge_id != judge_id:
            raise ValueError("Juiz não atribuído a esta disputa")

        dispute.resolution_type = resolution_type
        dispute.resolution = resolution
        dispute.refund_amount = refund_amount
        dispute.status = DisputeStatus.RESOLVED
        dispute.resolved_at = datetime.now()

        # Atualiza estatísticas do juiz
        cert = await self.get_active_certification(judge_id, uuid4(), JudgeLevel.L1_FLOOR)
        if cert:
            cert.total_disputes_resolved += 1

        # Atualiza reputação baseado em tempo de resolução
        resolution_time = (dispute.resolved_at - dispute.created_at).total_seconds() / 3600
        if resolution_time <= 4:  # Resolvido em 4h
            cert.reputation_score = min(Decimal("5.00"), cert.reputation_score + Decimal("0.1"))
        elif resolution_time > 72:  # Mais de 72h
            cert.reputation_score = max(Decimal("1.00"), cert.reputation_score - Decimal("0.2"))

        return dispute

    async def get_judge_stats(self, user_id: UUID) -> Dict[str, Any]:
        """Retorna estatísticas do juiz."""
        certs = [c for c in self.certifications.values() if c.user_id == user_id]
        disputes_resolved = [d for d in self.disputes.values() 
                            if d.assigned_judge_id == user_id and d.status == DisputeStatus.RESOLVED]

        avg_resolution_time = 0
        if disputes_resolved:
            times = [(d.resolved_at - d.created_at).total_seconds() / 3600 
                    for d in disputes_resolved if d.resolved_at]
            avg_resolution_time = sum(times) / len(times)

        return {
            "total_certifications": len(certs),
            "certifications": [
                {
                    "level": c.level.name,
                    "game_id": str(c.game_id),
                    "status": c.status.value,
                    "score": float(c.exam_score) if c.exam_score else None,
                    "expires_at": c.expires_at.isoformat() if c.expires_at else None
                }
                for c in certs
            ],
            "total_disputes_resolved": len(disputes_resolved),
            "avg_resolution_time_hours": round(avg_resolution_time, 2),
            "active_disputes": sum(1 for d in self.disputes.values() 
                                   if d.assigned_judge_id == user_id 
                                   and d.status in [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW])
        }


# ============== EXEMPLO DE USO ==============

async def main():
    """Demonstração do sistema de juízes."""
    system = JudgeCertificationSystem()

    # Cria usuários
    user1 = User(id=uuid4(), email="vendedor@example.com", display_name="João Vendedor")
    user2 = User(id=uuid4(), email="comprador@example.com", display_name="Maria Compradora")
    judge_user = User(id=uuid4(), email="juiz@example.com", display_name="Carlos Juiz")

    system.users[user1.id] = user1
    system.users[user2.id] = user2
    system.users[judge_user.id] = judge_user

    # Cria prova para L1
    game_id = uuid4()
    questions = [
        {
            "question": "Qual é a regra de priority em Magic: The Gathering?",
            "options": ["A) APNP", "B) NAP", "C) APNAP", "D) NAPNAP"],
            "correct_answer": 2  # C
        },
        {
            "question": "Em Pokémon TCG, quantas cartas de energia podem ser anexadas por turno?",
            "options": ["A) 1", "B) 2", "C) Ilimitado", "D) 3"],
            "correct_answer": 0  # A
        }
    ]

    exam = await system.create_exam(
        game_id=game_id,
        level=JudgeLevel.L1_FLOOR,
        title="Prova de Certificação Juiz L1 - Pokémon TCG",
        questions=questions
    )

    print(f"Exame criado: {exam.title}")
    print(f"Nível: {exam.level.name}")
    print(f"Nota mínima: {exam.passing_score}%")

    # Simula tentativa de prova
    attempt = await system.start_exam(exam.id, judge_user.id, "192.168.1.1")
    print(f"\nTentativa iniciada: {attempt.id}")

    # Submete respostas corretas
    result = await system.submit_exam(attempt.id, [2, 0])  # C, A
    print(f"Resultado: {result}")

    # Verifica certificação
    cert = await system.get_active_certification(judge_user.id, game_id, JudgeLevel.L1_FLOOR)
    if cert:
        print(f"\nCertificação concedida!")
        print(f"Nível: {cert.level.name}")
        print(f"Score: {cert.exam_score}%")
        print(f"Válida até: {cert.expires_at}")

    # Cria disputa
    order_id = uuid4()
    dispute = await system.create_dispute(
        order_id=order_id,
        initiator_id=user2.id,
        dispute_type=DisputeType.CONDITION_MISMATCH,
        description="Carta recebida em condição MP, mas anunciada como NM",
        evidence_urls=["https://example.com/evidence1.jpg"]
    )

    print(f"\nDisputa criada: {dispute.id}")
    print(f"Status: {dispute.status.value}")
    print(f"Juiz atribuído: {dispute.assigned_judge_id}")
    print(f"SLA: {dispute.sla_deadline}")

    # Juiz toma decisão
    if dispute.assigned_judge_id:
        resolved = await system.judge_decision(
            dispute_id=dispute.id,
            judge_id=dispute.assigned_judge_id,
            resolution_type=ResolutionType.REFUND_PARTIAL,
            resolution="Carta realmente em condição inferior ao anunciado. Reembolso parcial de 50%.",
            refund_amount=Decimal("50.00")
        )
        print(f"\nDisputa resolvida em: {(resolved.resolved_at - resolved.created_at).total_seconds() / 60:.1f} minutos")
        print(f"Resolução: {resolved.resolution}")

    # Estatísticas do juiz
    stats = await system.get_judge_stats(judge_user.id)
    print(f"\nEstatísticas do Juiz:")
    print(json.dumps(stats, indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())

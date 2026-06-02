from dataclasses import dataclass


@dataclass(frozen=True)
class GamePromptBundle:
    system_prompt: str
    few_shot_block: str
    response_format: str
    integrity_status: str = "ok"

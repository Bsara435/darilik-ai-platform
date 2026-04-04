from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "DariLik API"
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Supabase / PostgreSQL — SQLAlchemy URL (psycopg v3 driver)
    # Example: postgresql+psycopg://postgres.xxx:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
    database_url: str | None = Field(default=None, validation_alias="DATABASE_URL")

    # Google AI Studio / Gemini — https://aistudio.google.com/apikey
    gemini_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("GEMINI_API_KEY", "GOOGLE_API_KEY"),
    )
    # Single model ID; one API request per POST /tenants/explanations (no automatic model rotation).
    gemini_model: str = Field(
        default="gemini-2.0-flash",
        validation_alias=AliasChoices("GEMINI_MODEL", "GOOGLE_GEMINI_MODEL"),
    )

    # When True, POST /tenants/explanations returns realistic fixed copy (no Google API call).
    fake_gemini_explanations: bool = Field(
        default=True,
        validation_alias="FAKE_GEMINI_EXPLANATIONS",
    )

    # When True (default), Legal Advisor uses local mock conflicts + Arabic contract (no Anthropic, no python-docx).
    fake_legal_advisor: bool = Field(
        default=True,
        validation_alias="FAKE_LEGAL_ADVISOR",
    )

    # Legal Advisor — Anthropic Claude (https://console.anthropic.com/) — used only if fake_legal_advisor=False
    anthropic_api_key: str | None = Field(default=None, validation_alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(
        default="claude-sonnet-4-20250514",
        validation_alias="ANTHROPIC_MODEL",
    )

    # Demo landlord identity embedded in generated Arabic contracts
    legal_landlord_full_name: str = Field(
        default="أحمد العلوي",
        validation_alias="LEGAL_LANDLORD_FULL_NAME",
    )
    legal_landlord_name_latin: str = Field(
        default="Ahmed Alaoui",
        validation_alias="LEGAL_LANDLORD_NAME_LATIN",
    )
    legal_landlord_cin: str = Field(default="AB123456", validation_alias="LEGAL_LANDLORD_CIN")
    legal_landlord_address: str = Field(
        default="شارع محمد الخامس، الدار البيضاء",
        validation_alias="LEGAL_LANDLORD_ADDRESS",
    )
    legal_landlord_profession: str = Field(
        default="موظف",
        validation_alias="LEGAL_LANDLORD_PROFESSION",
    )
    demo_tenant_cin_placeholder: str = Field(
        default="—",
        validation_alias="DEMO_TENANT_CIN_PLACEHOLDER",
    )
    demo_tenant_address_placeholder: str = Field(
        default="حي المعاريف، الدار البيضاء",
        validation_alias="DEMO_TENANT_ADDRESS_PLACEHOLDER",
    )


settings = Settings()

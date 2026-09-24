"""Account status: resident and association sign-ups wait for team validation

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-24
"""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Accounts that already exist keep working.
    with op.batch_alter_table("users") as batch:
        batch.add_column(
            sa.Column("status", sa.String(10), nullable=False, server_default="active")
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("status")

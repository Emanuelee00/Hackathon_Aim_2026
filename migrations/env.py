from logging.config import fileConfig

from alembic import context

import accounts.models  # noqa: F401  (registers the tables on Base.metadata)
import agents.models  # noqa: F401
import db

config = context.config
if config.config_file_name and config.attributes.get("configure_logger", True):
    fileConfig(config.config_file_name)

# The documents table is still created by store.py, outside of migrations.
IGNORED_TABLES = {"documents"}


def include_object(obj, name, type_, reflected, compare_to):
    return not (type_ == "table" and name in IGNORED_TABLES)


with db.engine.connect() as connection:
    context.configure(
        connection=connection,
        target_metadata=db.Base.metadata,
        include_object=include_object,
        # SQLite cannot alter columns in place: batch mode recreates the table.
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()

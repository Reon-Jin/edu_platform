# backend/alembic/env.py

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# 把项目根目录加入路径，这样能 import 后端模块
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# 从 config.py 里读取设置
from config import settings
from sqlmodel import SQLModel

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# 解释 .ini 文件中的 logging 配置
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 指定要对哪个 metadata 做自动生成 support
target_metadata = SQLModel.metadata

# 动态把 sqlalchemy.url 指向 settings.MYSQL_URI
config.set_main_option("sqlalchemy.url", settings.MYSQL_URI)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    Skips Engine creation, only emits SQL."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.
    Creates Engine and applies migrations to the DB."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


# 根据当前模式调用不同方法
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

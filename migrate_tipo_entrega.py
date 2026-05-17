"""
Migration: Adicionar tipo_entrega e taxa_moto_flash_centavos na tabela pedidos
Execute: python migrate_tipo_entrega.py
"""
# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

from sqlalchemy import create_engine, text

DATABASE_URL = 'postgresql://postgres:3CVF5nG96O2GeKjZ@db.tfqruazyqcldldlxbyzm.supabase.co:5432/postgres'

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Aplicando migration: add tipo_entrega...")

    conn.execute(text("""
        ALTER TABLE pedidos
            ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(20) NOT NULL DEFAULT 'MOTO';
    """))
    print("  [OK] Coluna tipo_entrega adicionada")

    conn.execute(text("""
        ALTER TABLE pedidos
            ADD COLUMN IF NOT EXISTS taxa_moto_flash_centavos INTEGER NOT NULL DEFAULT 0;
    """))
    print("  [OK] Coluna taxa_moto_flash_centavos adicionada")

    # Constraint (ignorar erro se ja existe)
    try:
        conn.execute(text("""
            ALTER TABLE pedidos
                ADD CONSTRAINT chk_tipo_entrega
                CHECK (tipo_entrega IN ('MOTO', 'BICICLETA', 'MOTO_FLASH'));
        """))
        print("  [OK] Constraint chk_tipo_entrega adicionada")
    except Exception as e:
        if 'already exists' in str(e) or 'ja existe' in str(e):
            print("  [INFO] Constraint chk_tipo_entrega ja existia, pulando...")
        else:
            raise e

    conn.commit()
    print("\n[SUCESSO] Migration aplicada com sucesso!")

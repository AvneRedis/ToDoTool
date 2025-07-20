"""Add archived field to notes table

This migration adds an 'archived' boolean field to the notes table
to support archiving notes without using folder_id.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def upgrade():
    """Add archived column to notes table"""
    with engine.connect() as connection:
        # Add the archived column with default value False
        connection.execute(text("""
            ALTER TABLE notes 
            ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE
        """))
        connection.commit()
        print("Added 'archived' column to notes table")

def downgrade():
    """Remove archived column from notes table"""
    with engine.connect() as connection:
        # Remove the archived column
        connection.execute(text("""
            ALTER TABLE notes 
            DROP COLUMN archived
        """))
        connection.commit()
        print("Removed 'archived' column from notes table")

if __name__ == "__main__":
    print("Running migration: Add archived field to notes table")
    upgrade()
    print("Migration completed successfully")

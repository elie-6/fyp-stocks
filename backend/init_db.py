# backend/init_db.py
#run as module from root to create tables (python -m backend.init_db)

from backend.app.database import create_db_and_tables

if __name__ == "__main__":
    create_db_and_tables()
    print("✅ All tables created successfully")

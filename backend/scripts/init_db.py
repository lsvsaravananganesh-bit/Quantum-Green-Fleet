import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, engine
from app.models import user, vehicle, driver, trip, fuel, optimization, prediction

def init_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ All tables created successfully")

if __name__ == "__main__":
    init_database()

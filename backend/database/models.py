from sqlalchemy import Column, Integer, String, DateTime
from database.database import Base
from datetime import datetime
from sqlalchemy.sql import func

class Face(Base):
    __tablename__ = "faces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    embedding_path = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Face {self.id}: {self.name}>"
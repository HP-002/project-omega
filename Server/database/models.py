from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database.connection import Base

class Location(Base):
    __tablename__="locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default = datetime.now)

    cameras = relationship("Camera", back_populates="location")
    model_data = relationship("ModelData", back_populates="location")

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    location = relationship("Location", back_populates="cameras")
    created_at = Column(DateTime, default=datetime.now)
    
    model_data = relationship("ModelData", back_populates="camera")

class ModelData(Base):
    __tablename__ = "model_data"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    location = relationship("Location", back_populates="model_data")
    camera = relationship("Camera", back_populates="model_data")
    
    total_tables = Column(Integer)
    empty_tables = Column(Integer)
    occupied_tables = Column(Integer)
    total_people = Column(Integer)

    model = Column(String, index=True)
    process_time_ms = Column(Integer)
    
    timestamp = Column(DateTime, default=datetime.now)

from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from database.models import Location, Camera, ModelData
from schemas.model_data import ModelDataSchema, SummarySchema, ModelMetaSchema

#Location operations
def get_location_by_id(db: Session, location_id: int) -> Optional[Location]:
    """Get location by ID"""
    return db.query(Location).filter(Location.id == location_id).first()

def get_location_by_name(db: Session, name: str) -> Optional[Location]:
    """Get location by name"""
    return db.query(Location).filter(Location.name == name).first()

def create_location(db: Session, name: str, description: Optional[str] = None) -> Location:
    """Create a new location"""
    location = Location(name=name, description=description)
    db.add(location)
    db.commit()
    db.refresh(location)
    return location

def get_or_create_location(db: Session, location_id: str, location_name: Optional[str] = None) -> Location:
    """Get location by ID (as string) or create if not exists"""
    try:
        # Try to convert string ID to int
        location_id_int = int(location_id)
        location = get_location_by_id(db, location_id_int)
        if location:
            return location
    except ValueError:
        pass
    
    # If not found by ID, try by name if provided
    if location_name:
        location = get_location_by_name(db, location_name)
        if location:
            return location
    
    # Create new location
    name = location_name or f"Location {location_id}"
    return create_location(db, name=name)


# Camera CRUD operations
def get_camera_by_id(db: Session, camera_id: int) -> Optional[Camera]:
    """Get camera by ID"""
    return db.query(Camera).filter(Camera.id == camera_id).first()


def create_camera(db: Session, location_id: int, description: Optional[str] = None) -> Camera:
    """Create a new camera"""
    camera = Camera(location_id=location_id, description=description)
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera


def get_or_create_camera(db: Session, camera_id: str, location_id: int, description: Optional[str] = None) -> Camera:
    """Get camera by ID (as string) or create if not exists"""
    try:
        # Try to convert string ID to int
        camera_id_int = int(camera_id)
        camera = get_camera_by_id(db, camera_id_int)
        if camera:
            # Verify it belongs to the correct location
            if camera.location_id == location_id:
                return camera
    except ValueError:
        pass
    
    # Create new camera
    desc = description or f"Camera {camera_id}"
    return create_camera(db, location_id=location_id, description=desc)


# ModelData CRUD operations
def create_model_data(
    db: Session,
    location_id: int,
    camera_id: int,
    summary: SummarySchema,
    model: Optional[str] = None,
    process_time_ms: Optional[int] = None,
    timestamp: Optional[datetime] = None
) -> ModelData:
    """Create a new model data record"""
    model_data = ModelData(
        location_id=location_id,
        camera_id=camera_id,
        total_tables=summary.total_tables,
        empty_tables=summary.empty_tables,
        occupied_tables=summary.occupied_tables,
        total_people=summary.total_people,
        model=model,
        process_time_ms=process_time_ms,
        timestamp=timestamp
    )
    db.add(model_data)
    db.commit()
    db.refresh(model_data)
    return model_data


def save_model_data(db: Session, model_data_schema: ModelDataSchema) -> ModelData:
    """
    Save model data to database.
    Handles location_id and camera_id as strings (from schema) and gets/creates
    the corresponding Location and Camera records.
    """
    # Get or create location
    location = get_or_create_location(db, model_data_schema.location_id)
    
    # Get or create camera
    camera = get_or_create_camera(db, model_data_schema.camera_id, location.id)
    
    # Extract meta information
    model_name = None
    process_time = None
    if model_data_schema.meta:
        model_name = model_data_schema.meta.model
        process_time = model_data_schema.meta.process_time_ms
    
    # Create model data record
    return create_model_data(
        db=db,
        location_id=location.id,
        camera_id=camera.id,
        summary=model_data_schema.summary,
        model=model_name,
        process_time_ms=process_time,
        timestamp=model_data_schema.timestamp
    )
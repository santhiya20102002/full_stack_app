import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Image as KonvaImage, Transformer } from "react-konva";
import axios from "axios";
import parachuteImage from "./parachute.jpg";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-modal";
import './MarkImage.css';

const MarkImage = () => {
  const [shapes, setShapes] = useState([]); // Store all shapes
  const [currentShape, setCurrentShape] = useState(null); // Store current shape being drawn
  const [shapeType, setShapeType] = useState("rectangle"); // Type of shape being drawn (rectangle or circle)
  const [image, setImage] = useState(null); // The image being displayed
  const [dragging, setDragging] = useState(false); // State to track if a shape is being dragged
  const [transforming, setTransforming] = useState(false); // Track if transformer is active
  const [selectedShape, setSelectedShape] = useState(null); // Store the selected shape for transformer
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // State for preview modal
  const transformerRef = useRef(null);
  const shapeRefs = useRef({});
  const imgRef = useRef(null);

  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;

  const imgWidth = Math.floor(stageWidth);
  const imgHeight = Math.floor(stageHeight);

  const imgX = (stageWidth - imgWidth) / 2;
  const imgY = (stageHeight - imgHeight) / 2;

  useEffect(() => {
    const img = new window.Image();
    img.src = parachuteImage;
    img.onload = () => setImage(img);
  }, []);

  // Start drawing a new shape (rectangle or circle)
  const startDrawing = (e) => {
    if (dragging || transforming) return;

    const pos = e.target.getStage().getPointerPosition();

    const newShape = {
      id: Date.now(),
      type: shapeType,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: shapeType === "circle" ? 0 : 0,
      color: "blue",
      selected: false,
    };
    setCurrentShape(newShape);
  };

  const handleDraw = (e) => {
    if (dragging || transforming || !currentShape) return;

    const pos = e.target.getStage().getPointerPosition();

    if (currentShape.type === "rectangle") {
      const width = Math.min(imgWidth - currentShape.x, pos.x - currentShape.x);
      const height = Math.min(imgHeight - currentShape.y, pos.y - currentShape.y);
      setCurrentShape({
        ...currentShape,
        width,
        height,
      });
    } else if (currentShape.type === "circle") {
      const radius = Math.sqrt(Math.pow(pos.x - currentShape.x, 2) + Math.pow(pos.y - currentShape.y, 2));
      setCurrentShape({
        ...currentShape,
        radius: Math.max(radius, 0),
      });
    }
  };

  const endDrawing = () => {
    if (dragging || transforming || !currentShape) return;

    setShapes([...shapes, currentShape]);
    setCurrentShape(null);
  };

  const selectShape = (shape, e) => {
    if (dragging || transforming) return;

    setSelectedShape(shape);
    setShapes(
      shapes.map((s) =>
        s.id === shape.id ? { ...s, selected: !s.selected } : s
      )
    );
  };

  const deleteShape = () => {
    const newShapes = shapes.filter((shape) => !shape.selected);
    setShapes(newShapes);
    setSelectedShape(null);
  };

  const handleDragStart = () => {
    setDragging(true);
  };

  const handleDragEnd = (e, shape) => {
    setDragging(false);

    const node = e.target;

    if (shape.type === "circle") {
      const radius = shape.radius;
      const x = Math.max(radius, Math.min(imgWidth - radius, node.x()));
      const y = Math.max(radius, Math.min(imgHeight - radius, node.y()));

      const updatedShapes = shapes.map((s) =>
        s.id === shape.id
          ? {
            ...s,
            x,
            y,
          }
          : s
      );
      setShapes(updatedShapes);
    } else if (shape.type === "rectangle") {
      const x = Math.max(0, Math.min(imgWidth - shape.width, node.x()));
      const y = Math.max(0, Math.min(imgHeight - shape.height, node.y()));

      const updatedShapes = shapes.map((s) =>
        s.id === shape.id
          ? {
            ...s,
            x,
            y,
          }
          : s
      );
      setShapes(updatedShapes);
    }
  };

  const handleTransformStart = () => {
    setTransforming(true);
  };

  const handleTransformEnd = () => {
    setTransforming(false);

    const updatedShapes = shapes.map((s) => {
      if (s.id === selectedShape.id) {
        const node = shapeRefs.current[s.id];

        if (s.type === "circle") {
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const originalRadius = s.radius;
          let newRadius = originalRadius * Math.min(scaleX, scaleY);
          newRadius = Math.max(newRadius, 5);

          node.scaleX(1);
          node.scaleY(1);
          node.rotation(0);

          const newX = node.x();
          const newY = node.y();

          return {
            ...s,
            x: newX,
            y: newY,
            radius: newRadius,
          };
        } else {
          const width = Math.min(imgWidth - node.x(), node.width());
          const height = Math.min(imgHeight - node.y(), node.height());
          return {
            ...s,
            x: node.x(),
            y: node.y(),
            width,
            height,
          };
        }
      }
      return s;
    });

    setShapes(updatedShapes);
  };

  const handleSubmit = async () => {
    const coordinates = {};

    shapes.forEach((shape, index) => {
      const areaLabel = `Area${index + 1}`;

      if (shape.type === 'rectangle') {
        coordinates[areaLabel] = [
          [shape.x, shape.y],
          [shape.x + shape.width, shape.y + shape.height],
        ];
      } else if (shape.type === 'circle') {
        coordinates[areaLabel] = [
          [shape.x, shape.y],
          shape.radius,
        ];
      }
    });

    if (Object.keys(coordinates).length === 0) {
      toast.error("Please add at least one shape before submitting.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/marks', {
        coordinates,
      });
      console.log('Coordinates submitted:', response.data);
      toast.success(response.data.message);
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting the coordinates.");
    }
  };

  // Toggle the preview modal
  const togglePreview = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  return (
    <div>
      <ToastContainer />
      <div>
        <button onClick={() => setShapeType("rectangle")}>Draw Rectangle</button>
        <button onClick={() => setShapeType("circle")}>Draw Circle</button>
        <button onClick={deleteShape}>Delete Selected Shape</button>
        <button onClick={togglePreview}>Preview</button>
        <button onClick={handleSubmit}>Submit Coordinates</button>

      </div>
      
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={startDrawing}
        onMousemove={handleDraw}
        onMouseUp={endDrawing}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={imgWidth}
              height={imgHeight}
              x={imgX}
              y={imgY}
              ref={imgRef}
            />
          )}
          {shapes.map((shape) => {
            if (shape.type === "rectangle") {
              return (
                <Rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill="transparent"
                  stroke={shape.selected ? "red" : "blue"}
                  draggable
                  onClick={(e) => selectShape(shape, e)}
                  onDragStart={handleDragStart}
                  onDragEnd={(e) => handleDragEnd(e, shape)}
                  ref={(node) => {
                    shapeRefs.current[shape.id] = node;
                  }}
                  onTransformStart={handleTransformStart}
                  onTransformEnd={handleTransformEnd}
                />
              );
            }

            if (shape.type === "circle") {
              return (
                <Circle
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  fill="transparent"
                  stroke={shape.selected ? "red" : "blue"}
                  draggable
                  onClick={(e) => selectShape(shape, e)}
                  onDragStart={handleDragStart}
                  onDragEnd={(e) => handleDragEnd(e, shape)}
                  ref={(node) => {
                    shapeRefs.current[shape.id] = node;
                  }}
                  onTransformStart={handleTransformStart}
                  onTransformEnd={handleTransformEnd}
                />
              );
            }
            return null;
          })}
          {selectedShape && (
            <Transformer
              ref={transformerRef}
              nodes={[shapeRefs.current[selectedShape.id]]}
            />
          )}
        </Layer>
      </Stage>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onRequestClose={togglePreview} contentLabel="Preview Modal">
        <h2>Preview</h2>
        <button className="modal-close-button" onClick={togglePreview}>
        &times;
        </button> 
        <Stage width={imgWidth} height={imgHeight}>
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                width={imgWidth}
                height={imgHeight}
                x={imgX}
                y={imgY}
              />
            )}
            {shapes.map((shape) => {
              if (shape.type === "rectangle") {
                return (
                  <Rect
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill="transparent"
                    stroke="blue"
                  />
                );
              }
              if (shape.type === "circle") {
                return (
                  <Circle
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius}
                    fill="transparent"
                    stroke="blue"
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </Modal>
    </div>
  );
};

export default MarkImage;

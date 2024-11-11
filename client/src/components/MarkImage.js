import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Image as KonvaImage, Transformer } from "react-konva";
import axios from "axios";
import parachuteImage from "./parachute.jpg"; // Your static image
import { toast, ToastContainer } from "react-toastify"; // Import toastify
import "react-toastify/dist/ReactToastify.css"; // Import the CSS

const MarkImage = () => {
  const [shapes, setShapes] = useState([]); // Store all shapes
  const [currentShape, setCurrentShape] = useState(null); // Store current shape being drawn
  const [shapeType, setShapeType] = useState("rectangle"); // Type of shape being drawn (rectangle or circle)
  const [image, setImage] = useState(null); // The image being displayed
  const [dragging, setDragging] = useState(false); // State to track if a shape is being dragged
  const [transforming, setTransforming] = useState(false); // Track if transformer is active
  const [selectedShape, setSelectedShape] = useState(null); // Store the selected shape for transformer
  const transformerRef = useRef(null);
  const shapeRefs = useRef({});
  const imgRef = useRef(null);

  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;

  // Calculate the image size to be 90% of the page size
  const imgWidth = Math.floor(stageWidth); // 90% of the page width
  const imgHeight = Math.floor(stageHeight); // 90% of the page height

  // Center the image on the stage
  const imgX = (stageWidth - imgWidth) / 2; // Center the image horizontally
  const imgY = (stageHeight - imgHeight) / 2; // Center the image vertically

  useEffect(() => {
    const img = new window.Image();
    img.src = parachuteImage;
    img.onload = () => setImage(img);
  }, []);

  // Start drawing a new shape (rectangle or circle)
  const startDrawing = (e) => {
    if (dragging || transforming) return; // Prevent starting a new shape if dragging or transforming is active

    const pos = e.target.getStage().getPointerPosition();

    // Initialize currentShape for rectangle or circle
    const newShape = {
      id: Date.now(),
      type: shapeType,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: shapeType === "circle" ? 0 : 0, // Start with a zero radius for circle
      color: "blue",
      selected: false,
    };
    setCurrentShape(newShape); // Set current shape for drawing
  };

  // Handle drawing as mouse moves (for resizing and circle updates)
  const handleDraw = (e) => {
    if (dragging || transforming || !currentShape) return; // Prevent drawing if dragging or transforming is active

    const pos = e.target.getStage().getPointerPosition();

    if (currentShape.type === "rectangle") {
      // Prevent the rectangle from going beyond the image size
      const width = Math.min(imgWidth - currentShape.x, pos.x - currentShape.x); // Prevent exceeding the image width
      const height = Math.min(imgHeight - currentShape.y, pos.y - currentShape.y); // Prevent exceeding the image height
      setCurrentShape({
        ...currentShape,
        width,
        height,
      });
    } else if (currentShape.type === "circle") {
      // Calculate radius for the circle (distance from the center to the current mouse position)
      const radius = Math.sqrt(Math.pow(pos.x - currentShape.x, 2) + Math.pow(pos.y - currentShape.y, 2));
      // Ensure that the radius is non-negative
      setCurrentShape({
        ...currentShape,
        radius: Math.max(radius, 0), // Ensure radius is non-negative
      });
    }
  };

  // End drawing the shape (save it to the state)
  const endDrawing = () => {
    if (dragging || transforming || !currentShape) return; // Prevent drawing if dragging or transforming is active

    setShapes([...shapes, currentShape]); // Add completed shape to shapes array
    setCurrentShape(null); // Reset current shape after drawing is finished
  };

  // Handle selecting a shape (clicking on it)
  const selectShape = (shape, e) => {
    if (dragging || transforming) return; // Prevent selection while dragging or transforming

    setSelectedShape(shape); // Set the selected shape for transformer
    setShapes(
      shapes.map((s) =>
        s.id === shape.id ? { ...s, selected: !s.selected } : s
      )
    );
  };

  // Delete selected shape
  const deleteShape = () => {
    const newShapes = shapes.filter((shape) => !shape.selected); // Remove selected shape
    setShapes(newShapes);
    setSelectedShape(null);
  };

  const handleDragStart = () => {
    setDragging(true); // Set dragging to true when drag starts
  };

  const handleDragEnd = (e, shape) => {
    setDragging(false); // Reset dragging to false when drag ends

    const node = e.target; // Get the Konva node of the dragged shape

    if (shape.type === "circle") {
      const radius = shape.radius;

      // Constrain the circle within the image's bounds
      const x = Math.max(radius, Math.min(imgWidth - radius, node.x())); // Prevent the circle from going beyond the image's width
      const y = Math.max(radius, Math.min(imgHeight - radius, node.y())); // Prevent the circle from going beyond the image's height

      const updatedShapes = shapes.map((s) =>
        s.id === shape.id
          ? {
            ...s,
            x, // Constrained x position
            y, // Constrained y position
          }
          : s
      );
      setShapes(updatedShapes);
    } else if (shape.type === "rectangle") {
      // Constrain the rectangle within the image's bounds
      const x = Math.max(0, Math.min(imgWidth - shape.width, node.x())); // Prevent going beyond the image's width
      const y = Math.max(0, Math.min(imgHeight - shape.height, node.y())); // Prevent going beyond the image's height

      const updatedShapes = shapes.map((s) =>
        s.id === shape.id
          ? {
            ...s,
            x, // Constrained x position
            y, // Constrained y position
          }
          : s
      );
      setShapes(updatedShapes);
    }
  };

  // When transformer starts resizing, set resizing flag to true
  const handleTransformStart = () => {
    setTransforming(true); // Mark transformer as active
  };

  const handleTransformEnd = () => {
    setTransforming(false); // Mark transformer as inactive

    const updatedShapes = shapes.map((s) => {
      if (s.id === selectedShape.id) {
        const node = shapeRefs.current[s.id]; // Get the Konva node for the selected shape

        if (s.type === "circle") {
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          const originalRadius = s.radius;
          let newRadius = originalRadius * Math.min(scaleX, scaleY);
          newRadius = Math.max(newRadius, 5); // Prevent the circle from becoming too small

          // Reset scale and rotation after transformation
          node.scaleX(1); // Reset scaleX after applying it manually
          node.scaleY(1); // Reset scaleY after applying it manually
          node.rotation(0); // Reset rotation to zero for the future transformations

          // The center of the circle should stay at the same position
          const newX = node.x();
          const newY = node.y();

          return {
            ...s,
            x: newX,           // Keep the same center X position
            y: newY,           // Keep the same center Y position
            radius: newRadius, // Update the radius with the new size
          };
        } else {
          // For other shapes (like rectangles), apply similar logic
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

    setShapes(updatedShapes); // Update the shapes array with transformed shapes
  };

  // Submit coordinates to the backend
  const handleSubmit = async () => {
    const coordinates = {};

    shapes.forEach((shape, index) => {
      const areaLabel = `Area${index + 1}`;

      if (shape.type === 'rectangle') {
        // For rectangles, we calculate the coordinates of the top-left corner and dimensions
        coordinates[areaLabel] = [
          [shape.x, shape.y],
          [shape.x + shape.width, shape.y + shape.height],
        ];
      } else if (shape.type === 'circle') {
        // For circles, we store the center coordinates and radius
        coordinates[areaLabel] = [
          [shape.x, shape.y], // Center point
          shape.radius, // Radius
        ];
      }
    });

    // Check if coordinates are empty
    if (Object.keys(coordinates).length === 0) {
      toast.error("Please add at least one shape before submitting.");
      return; // Exit the function if no shapes are added
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


  return (
    <div>
      <ToastContainer />
      <div>
        <button onClick={() => setShapeType("rectangle")}>Draw Rectangle</button>
        <button onClick={() => setShapeType("circle")}>Draw Circle</button>
        <button onClick={deleteShape}>Delete Selected Shape</button>
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
              x={imgX} // Center the image horizontally
              y={imgY} // Center the image vertically
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
    </div>
  );
};

export default MarkImage;

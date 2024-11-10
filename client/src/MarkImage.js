import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Image as KonvaImage, Transformer } from "react-konva";
import axios from "axios";
import parachuteImage from "./parachute.jpg"; // Your static image
import { toast ,ToastContainer} from "react-toastify"; // Import toastify
import "react-toastify/dist/ReactToastify.css"; // Import the CSS

const MarkImage = () => {
  const [shapes, setShapes] = useState([]); // Store all shapes
  const [currentShape, setCurrentShape] = useState(null); // Store current shape being drawn
  const [shapeType, setShapeType] = useState("rectangle"); // Type of shape being drawn (rectangle, polygon, or circle)
  const [image, setImage] = useState(null); // The image being displayed
  const [dragging, setDragging] = useState(false); // State to track if a shape is being dragged
  const [transforming, setTransforming] = useState(false); // Track if transformer is active
  const [selectedShape, setSelectedShape] = useState(null); // Store the selected shape for transformer
  const transformerRef = useRef(null); 
  const shapeRefs = useRef({}); 
  const imgRef = useRef(null); 

  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;

  const imgWidth = image ? image.width : 0;
  const imgHeight = image ? image.height : 0;

  useEffect(() => {
    const img = new window.Image();
    img.src = parachuteImage;
    img.onload = () => setImage(img);
  }, []);

  // Start drawing a new shape (rectangle, polygon, or circle)
  const startDrawing = (e) => {
    if (dragging || transforming) return; // Prevent starting a new shape if dragging or transforming is active

    const pos = e.target.getStage().getPointerPosition();

    // Initialize currentShape for rectangle, polygon, or circle
    const newShape = {
      id: Date.now(),
      type: shapeType,
      x: pos.x,
      y: pos.y,
      points: shapeType === "polygon" ? [pos.x, pos.y] : [], // For polygon, start with one point
      width: 0,
      height: 0,
      radius: shapeType === "circle" ? 0 : 0, // Start with a zero radius for circle
      color: "blue",
      selected: false,
    };
    setCurrentShape(newShape); // Set current shape for drawing
  };

  // Handle drawing as mouse moves (for resizing and polygon updates)
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
    } else if (currentShape.type === "polygon") {
      // Add new point for polygon as the mouse moves
      if (currentShape.points.length < 12) {
        setCurrentShape({
          ...currentShape,
          points: [...currentShape.points, pos.x, pos.y],
        });
      }
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

    if (shape.type === "circle") {
      // For circle, we need to ensure that the entire circle stays within the image bounds
      const radius = shape.radius;
      const x = Math.max(radius, Math.min(imgWidth - radius, e.target.x())); // Prevent going beyond the image width
      const y = Math.max(radius, Math.min(imgHeight - radius, e.target.y())); // Prevent going beyond the image height

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
      // For rectangle, the logic stays the same as before
      const x = Math.max(0, Math.min(imgWidth - shape.width, e.target.x())); // Prevent going beyond the image width
      const y = Math.max(0, Math.min(imgHeight - shape.height, e.target.y())); // Prevent going beyond the image height

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

  // When transform ends, set resizing flag to false and ensure no shape goes out of bounds
  const handleTransformEnd = () => {
    setTransforming(false); // Mark transformer as inactive

    const updatedShapes = shapes.map((s) => {
      if (s.id === selectedShape.id) {
        const node = shapeRefs.current[s.id];

        // For circle, ensure width and height are within the image bounds
        if (s.type === "circle") {
          const radius = Math.min(imgWidth - node.x(), imgHeight - node.y(), node.radius());
          return {
            ...s,
            x: node.x(),
            y: node.y(),
            radius: radius,
          };
        } else {
          const width = Math.min(imgWidth - node.x(), node.width()); // Prevent shape from expanding beyond the image width
          const height = Math.min(imgHeight - node.y(), node.height()); // Prevent shape from expanding beyond the image height
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

  // Submit coordinates to the backend
  // const handleSubmit = async () => {
  //   const coordinates = {};

  //   shapes.forEach((shape, index) => {
  //     const areaLabel = `Area${index + 1}`;
  //     if (shape.type === "rectangle") {
  //       const rectangleCoordinates = [
  //         [shape.x, shape.y], // Top-left corner
  //         [shape.x + shape.width, shape.y + shape.height], // Bottom-right corner
  //       ];
  //       coordinates[areaLabel] = rectangleCoordinates;
  //     } else if (shape.type === "circle") {
  //       coordinates[areaLabel] = {
  //         x: shape.x,
  //         y: shape.y,
  //         radius: shape.radius,
  //       };
  //     }
  //   });

  //   try {
  //     console.log(coordinates); // Log the coordinates
  //     await axios.post("http://localhost:5000/api/marks", { coordinates });
  //     console.log("Coordinates submitted:", coordinates);
  //   } catch (err) {
  //     console.error("Error submitting coordinates", err);
  //   }
  // };

  const handleSubmit = async () => {
    const coordinates = {};

    shapes.forEach((shape, index) => {
      const areaLabel = `Area${index + 1}`;
      
      if (shape.type === 'rectangle') {
        // For rectangles, we send two points: top-left and bottom-right corner
        coordinates[areaLabel] = [
          [shape.x, shape.y],
          [shape.x + shape.width, shape.y + shape.height],
        ];
      } else if (shape.type === 'circle') {
        // For circles, we send the center point and the radius
        coordinates[areaLabel] = [
          [shape.x, shape.y], // Center point
          shape.radius, // Radius
        ];
      }
    });

    try {
        console.log(coordinates); // Log the coordinates

      const response = await axios.post('http://localhost:5000/api/marks', {
        coordinates,
      });
      console.log('Coordinates submitted:', response.data);
      toast.success( response.data.message);
    } catch (err) {
      console.error('Error submitting coordinates', err);
      toast.error("Error submitting coordinates");

    }
  };

  // Ensure the transformer is attached to the selected shape
  useEffect(() => {
    if (selectedShape && transformerRef.current) {
      // Attach the transformer only when the shape is selected
      transformerRef.current.nodes([shapeRefs.current[selectedShape.id]]);
      transformerRef.current.getLayer().batchDraw(); // Update the layer
    }
  }, [selectedShape]);

  return (
    <div>
        <button onClick={() => setShapeType("rectangle")}>Draw Rectangle</button>
        <button onClick={() => setShapeType("circle")}>Draw Circle</button>
        <button onClick={deleteShape}>Delete Selected Shape</button>
        <button onClick={handleSubmit}>Submit Coordinates</button>
        <ToastContainer />


      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={startDrawing}
        onMouseMove={handleDraw}
        onMouseUp={endDrawing}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={stageWidth}
              height={stageHeight}
              ref={imgRef}
            />
          )}

          {shapes.map((shape) => {
            if (shape.type === "rectangle") {
              return (
                <Rect
                  key={shape.id}
                  ref={(node) => { shapeRefs.current[shape.id] = node; }}
                  {...shape}
                  fill="transparent" // No fill color
                  stroke={shape.selected ? "red" : "blue"} // Red border if selected
                  strokeWidth={2} // Border width
                  draggable
                  onClick={(e) => selectShape(shape, e)} // Select shape on click
                  onDragStart={handleDragStart} // Track dragging start
                  onDragEnd={(e) => handleDragEnd(e, shape)} // Track drag end
                />
              );
            } else if (shape.type === "circle") {
              return (
                <Circle
                  key={shape.id}
                  ref={(node) => { shapeRefs.current[shape.id] = node; }}
                  {...shape}
                  fill="transparent" // No fill color
                  stroke={shape.selected ? "red" : "blue"} // Red border if selected
                  strokeWidth={2} // Border width
                  draggable
                  onClick={(e) => selectShape(shape, e)} // Select shape on click
                  onDragStart={handleDragStart} // Track dragging start
                  onDragEnd={(e) => handleDragEnd(e, shape)} // Track drag end
                />
              );
            }
            return null;
          })}

          {/* Transformer for selected shape */}
          {selectedShape && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={true}
              resizeEnabled={true}
              onTransformStart={handleTransformStart} // Start transforming
              onTransformEnd={handleTransformEnd} // End transforming
            />
          )}
        </Layer>
      </Stage>
    </div>
  );

};



export default MarkImage;

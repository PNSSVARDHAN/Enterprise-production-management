import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar, Radar } from "react-chartjs-2";
import "chart.js/auto";
import { Accordion, Card, Button, Form, Pagination, InputGroup, Dropdown } from "react-bootstrap";
import "./EmployeeProductivityGraphs.css";

// Simple scrollable chart component
const ScrollableChart = ({ chartType, chartData, chartOptions, dataCount }) => {
    // Calculate width based on data points - increase width for larger datasets
    const containerStyle = {
        width: dataCount > 10 ? `${Math.max(100, dataCount * 80)}px` : '100%', // Increased from 50px to 80px per item
        height: '100%',
        position: 'relative'
    };
    
    const renderChart = () => {
        switch(chartType) {
            case 'line':
                return <Line data={chartData} options={chartOptions} />;
            case 'bar':
                return <Bar data={chartData} options={chartOptions} />;
            case 'radar':
                return <Radar data={chartData} options={chartOptions} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="chart-scrollable-outer">
            <div className="chart-scrollable-inner" style={containerStyle}>
                {renderChart()}
            </div>
        </div>
    );
};

const EmployeeProductivityGraphs = () => {
    const [orders, setOrders] = useState([]);
    const [employees, setEmployees] = useState([]); // Store employee data
    const [employeeMap, setEmployeeMap] = useState({}); // Map to quickly look up employee names by ID
    const [loading, setLoading] = useState(true);
    const [employeeDisplayLimit, setEmployeeDisplayLimit] = useState(10);
    const [employeeFilter, setEmployeeFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [displayModes, setDisplayModes] = useState({});
    
    // Constants for pagination
    const ITEMS_PER_PAGE = 8;
    const MAX_RADAR_EMPLOYEES = 8;

    useEffect(() => {
        // Fetch both productivity data and employee data in parallel
        Promise.all([
            fetchProductivityData(),
            fetchEmployeeData()
        ]).catch(error => {
            console.error("Error initializing data:", error);
            setLoading(false);
        });
    }, []);

    // Fetch employee data to get names
    const fetchEmployeeData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/employees/`);
            setEmployees(response.data);
            
            // Create a mapping of employee IDs to names for quick lookup
            const mapping = {};
            response.data.forEach(emp => {
                mapping[emp.id] = emp.name;
            });
            setEmployeeMap(mapping);
        } catch (error) {
            console.error("❌ Error fetching employee data:", error);
        }
    };

    const fetchProductivityData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/dashboard/orders-productivity`);
            const formattedOrders = response.data.map(order => ({
                order_id: order.id,
                order_number: order.order_number,
                timePerPiece: order.MachineAllocations.flatMap(machine =>
                    machine.EmployeeTasks.map(task => ({
                        employee_id: task.employee_id,
                        time_per_piece: task.total_completed ? (8 * 60) / task.total_completed : 0
                    }))
                ),
                totalPieces: order.MachineAllocations.flatMap(machine =>
                    machine.EmployeeTasks.map(task => ({
                        employee_id: task.employee_id,
                        total_completed: Number(task.total_completed) || 0
                    }))
                ),
                hourlyTrend: [],
                employeePerformance: order.MachineAllocations.flatMap(machine =>
                    machine.EmployeeTasks.map(task => ({
                        employee_id: task.employee_id,
                        total_completed: Number(task.total_completed) || 0
                    }))
                )
            }));
            setOrders(formattedOrders);
        } catch (error) {
            console.error("❌ Error fetching productivity data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Generate dynamic colors for any number of employees
    const generateColorPalette = (numColors) => {
        const baseColors = [
            [54, 162, 235],   // blue
            [75, 192, 192],   // teal
            [153, 102, 255],  // purple
            [255, 159, 64],   // orange
            [255, 99, 132],   // pink
            [89, 212, 153],   // green
            [201, 203, 207],  // grey
            [242, 120, 75],   // orange-red
            [120, 88, 166],   // purple
            [66, 133, 244],   // blue
            [52, 168, 83],    // green
            [251, 188, 4],    // yellow
            [234, 67, 53],    // red
            [16, 99, 146],    // dark blue
            [184, 28, 198],   // magenta
            [0, 172, 193],    // cyan
            [124, 179, 66],   // light green
            [191, 90, 242],   // light purple
        ];
        
        // Generate colors that vary in hue for any additional needed
        const colors = {
            backgroundColors: [],
            borderColors: []
        };
        
        for (let i = 0; i < numColors; i++) {
            let colorIndex = i % baseColors.length;
            let color = baseColors[colorIndex];
            
            // Add opacity for background color
            colors.backgroundColors.push(`rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`);
            colors.borderColors.push(`rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`);
        }
        
        return colors;
    };

    // Filter and paginate employee data
    const processEmployeeData = (data, filter, page, itemsPerPage, orderIndex) => {
        if (!data || !Array.isArray(data)) return { filteredData: [], totalPages: 0 };
        
        // Apply filter if needed
        let filteredData = data;
        if (filter) {
            const lowerFilter = filter.toLowerCase();
            filteredData = data.filter(item => {
                // Get employee name from the mapping
                const employeeName = employeeMap[item.employee_id] || "";
                
                // Check if filter matches either ID or name
                return (`${employeeName}`).toLowerCase().includes(lowerFilter) || 
                       (`${item.employee_id}`).toLowerCase().includes(lowerFilter);
            });
        }
        
        // Calculate pagination
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        
        const displayMode = displayModes[`${orderIndex}-mode`] || 'paginate';
        
        // If we're in "all" mode and there are too many items for radar chart
        if (displayMode === 'all' && data.length > MAX_RADAR_EMPLOYEES) {
            // For radar charts especially, limit the maximum number of items to display
            const radarData = filteredData.slice(0, MAX_RADAR_EMPLOYEES);
            
            return {
                filteredData: displayMode === 'all' ? filteredData : paginatedData,
                radarData,
                totalPages,
                exceedsRadarLimit: filteredData.length > MAX_RADAR_EMPLOYEES
            };
        }
        
        return {
            filteredData: displayMode === 'all' ? filteredData : paginatedData,
            radarData: paginatedData,
            totalPages,
            exceedsRadarLimit: filteredData.length > MAX_RADAR_EMPLOYEES
        };
    };

    // Set the display mode for a specific order (paginate or show all)
    const toggleDisplayMode = (orderIndex) => {
        setDisplayModes(prev => {
            const currentMode = prev[`${orderIndex}-mode`] || 'paginate';
            return {
                ...prev,
                [`${orderIndex}-mode`]: currentMode === 'paginate' ? 'all' : 'paginate'
            };
        });
    };

    // Update the page for a specific order
    const handlePageChange = (orderIndex, page) => {
        setCurrentPage(prevPages => ({
            ...prevPages,
            [orderIndex]: page
        }));
    };

    // Determine if we need to force width for scrollable charts
    const getScrollableChartStyles = (dataCount) => {
        if (dataCount <= 10) return {};
        
        // Determine width based on data count
        const baseWidth = 100; // Base width in percentage
        const widthPerItem = 25; // Extra width per item beyond 10 items
        const extraWidth = (dataCount - 10) * widthPerItem;
        
        return {
            width: `${baseWidth + extraWidth}px`,
            minWidth: `${baseWidth + extraWidth}px`
        };
    };

    // Function to handle scroll events for gradient indicators
    const handleScroll = (event) => {
        const container = event.target;
        const isScrolledToLeft = container.scrollLeft === 0;
        const isScrolledToRight = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
        
        if (isScrolledToLeft) {
            container.classList.remove('scrolled-left');
        } else {
            container.classList.add('scrolled-left');
        }
        
        if (isScrolledToRight) {
            container.classList.add('scrolled-right');
        } else {
            container.classList.remove('scrolled-right');
        }
    };

    // Chart options and styles
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 15,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 12,
                        family: "'Poppins', sans-serif",
                        weight: '600'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1a1a2e',
                bodyColor: '#333',
                bodyFont: {
                    size: 13
                },
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                padding: 15,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
                displayColors: true,
                boxWidth: 10,
                boxHeight: 10,
                boxPadding: 5,
                usePointStyle: true,
                callbacks: {
                    labelTextColor: function(context) {
                        return '#333';
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    font: {
                        size: 11,
                        family: "'Poppins', sans-serif"
                    },
                    color: '#555'
                }
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.03)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        size: 11,
                        family: "'Poppins', sans-serif"
                    },
                    color: '#555',
                    padding: 10
                }
            }
        }
    };

    // Radar specific options
    const radarOptions = {
        ...chartOptions,
        scales: undefined,
        elements: {
            line: {
                borderWidth: 2
            },
            point: {
                radius: 4,
                hoverRadius: 6,
                borderWidth: 2,
                hoverBorderWidth: 2
            }
        },
        scales: {
            r: {
                angleLines: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.03)'
                },
                pointLabels: {
                    font: {
                        size: 11,
                        family: "'Poppins', sans-serif"
                    },
                    color: '#555'
                },
                ticks: {
                    backdropColor: 'transparent',
                    color: '#555',
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    return (
        <div className="container py-5">
            <h2 className="text-center text-primary mb-4">Employee Productivity Analysis</h2>

            {loading ? (
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading productivity data...</p>
                </div>
            ) : orders.length > 0 ? (
                <Accordion defaultActiveKey="0">
                    {orders.map((order, index) => {
                        // Initialize page if not set
                        const currentOrderPage = (currentPage && currentPage[index]) || 1;
                        
                        // Process data for each chart with pagination and filtering
                        const timePerPieceData = processEmployeeData(
                            order.timePerPiece, 
                            employeeFilter, 
                            currentOrderPage, 
                            ITEMS_PER_PAGE,
                            index
                        );
                        
                        const totalPiecesData = processEmployeeData(
                            order.totalPieces, 
                            employeeFilter, 
                            currentOrderPage, 
                            ITEMS_PER_PAGE,
                            index
                        );
                        
                        const employeePerformanceData = processEmployeeData(
                            order.employeePerformance, 
                            employeeFilter, 
                            currentOrderPage, 
                            ITEMS_PER_PAGE,
                            index
                        );
                        
                        // Generate colors for the bar chart
                        const barColors = generateColorPalette(totalPiecesData.filteredData.length);
                        
                        // Determine if we should show radar or alternate visualization
                        const displayMode = displayModes[`${index}-mode`] || 'paginate';
                        const showRadar = !employeePerformanceData.exceedsRadarLimit || 
                                         (employeePerformanceData.exceedsRadarLimit && displayMode === 'paginate');
                        
                        return (
                            <Card key={order.order_id}>
                                <Accordion.Item eventKey={String(index)}>
                                    <Accordion.Header>
                                        <span className="order-header">
                                            <span className="order-number">Order #{order.order_number}</span>
                                            <span className="order-id"> (ID: {order.order_id})</span>
                                            <span className="employee-count ms-2 badge bg-info">
                                                {order.timePerPiece?.length || 0} Employees
                                            </span>
                                        </span>
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        {/* Data controls */}
                                        <div className="mb-4 chart-controls">
                                            <div className="row align-items-center">
                                                <div className="col-md-4 mb-3 mb-md-0">
                                                    <InputGroup>
                                                        <Form.Control
                                                            placeholder="Filter by employee name or ID..."
                                                            value={employeeFilter}
                                                            onChange={(e) => setEmployeeFilter(e.target.value)}
                                                            aria-label="Filter employees"
                                                        />
                                                        {employeeFilter && (
                                                            <Button 
                                                                variant="outline-secondary"
                                                                onClick={() => setEmployeeFilter("")}
                                                            >
                                                                Clear
                                                            </Button>
                                                        )}
                                                    </InputGroup>
                                                </div>
                                                <div className="col-md-4 mb-3 mb-md-0 text-center">
                                                    {timePerPieceData.totalPages > 1 && (
                                                        <Pagination className="justify-content-center mb-0">
                                                            <Pagination.First 
                                                                onClick={() => handlePageChange(index, 1)} 
                                                                disabled={currentOrderPage === 1}
                                                            />
                                                            <Pagination.Prev 
                                                                onClick={() => handlePageChange(index, Math.max(1, currentOrderPage - 1))}
                                                                disabled={currentOrderPage === 1}
                                                            />
                                                            
                                                            {/* Display page numbers */}
                                                            {Array.from({ length: Math.min(5, timePerPieceData.totalPages) }, (_, i) => {
                                                                // Calculate the page number to display - centered around current page
                                                                let pageNum;
                                                                if (timePerPieceData.totalPages <= 5) {
                                                                    pageNum = i + 1;
                                                                } else {
                                                                    const midpoint = 2;
                                                                    const min = Math.max(1, currentOrderPage - midpoint);
                                                                    const max = Math.min(timePerPieceData.totalPages, min + 4);
                                                                    pageNum = min + i;
                                                                    if (pageNum > max) return null;
                                                                }
                                                                
                                                                return (
                                                                    <Pagination.Item
                                                                        key={pageNum}
                                                                        active={currentOrderPage === pageNum}
                                                                        onClick={() => handlePageChange(index, pageNum)}
                                                                    >
                                                                        {pageNum}
                                                                    </Pagination.Item>
                                                                );
                                                            }).filter(Boolean)}
                                                            
                                                            <Pagination.Next 
                                                                onClick={() => handlePageChange(index, Math.min(timePerPieceData.totalPages, currentOrderPage + 1))}
                                                                disabled={currentOrderPage === timePerPieceData.totalPages}
                                                            />
                                                            <Pagination.Last 
                                                                onClick={() => handlePageChange(index, timePerPieceData.totalPages)}
                                                                disabled={currentOrderPage === timePerPieceData.totalPages}
                                                            />
                                                        </Pagination>
                                                    )}
                                                </div>
                                                <div className="col-md-4 mb-3 mb-md-0 text-md-end">
                                                    <Button
                                                        variant={displayMode === 'paginate' ? 'outline-primary' : 'primary'}
                                                        size="sm"
                                                        onClick={() => toggleDisplayMode(index)}
                                                        className="me-2"
                                                    >
                                                        {displayMode === 'paginate' ? 'Show All Employees' : 'Show Paginated View'}
                                                    </Button>
                                                    {employeePerformanceData.exceedsRadarLimit && displayMode === 'all' && (
                                                        <span className="badge bg-warning text-dark">
                                                            Radar chart limited to {MAX_RADAR_EMPLOYEES} employees
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-4 justify-content-center">
                                            <div className="col-12 col-md-6">
                                                <div className="card shadow-sm">
                                                    <h5 className="chart-title">Time per Piece Analysis</h5>
                                                    {timePerPieceData.filteredData.length === 0 ? (
                                                        <div className="chart-empty-state">No data available for the selected filters</div>
                                                    ) : (
                                                        <div style={{ height: '300px', overflow: 'hidden' }}>
                                                            <ScrollableChart
                                                                chartType="line"
                                                                chartData={{
                                                                    labels: timePerPieceData.filteredData.map(d => employeeMap[d.employee_id] || `Emp ${d.employee_id}`),
                                                                    datasets: [{
                                                                        label: "Minutes per Piece",
                                                                        data: timePerPieceData.filteredData.map(d => parseFloat(d.time_per_piece) || 0),
                                                                        borderColor: "rgba(66, 133, 244, 1)",
                                                                        backgroundColor: "rgba(66, 133, 244, 0.2)",
                                                                        fill: true,
                                                                        tension: 0.4,
                                                                        borderWidth: 3,
                                                                        pointBackgroundColor: "rgba(66, 133, 244, 1)",
                                                                        pointBorderColor: "#fff",
                                                                        pointRadius: timePerPieceData.filteredData.length > 15 ? 3 : 5,
                                                                        pointHoverRadius: timePerPieceData.filteredData.length > 15 ? 5 : 7
                                                                    }]
                                                                }}
                                                                chartOptions={{
                                                                    ...chartOptions,
                                                                    scales: {
                                                                        ...chartOptions.scales,
                                                                        x: {
                                                                            ...chartOptions.scales.x,
                                                                            ticks: {
                                                                                ...chartOptions.scales.x.ticks,
                                                                                autoSkip: false,
                                                                                maxRotation: 45,
                                                                                minRotation: 45,
                                                                                font: {
                                                                                    ...chartOptions.scales.x.ticks.font,
                                                                                    size: 9 // Slightly smaller font for better fit
                                                                                }
                                                                            }
                                                                        }
                                                                    },
                                                                    maintainAspectRatio: false,
                                                                }}
                                                                dataCount={timePerPieceData.filteredData.length}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <div className="card shadow-sm">
                                                    <h5 className="chart-title">Productivity by Employee</h5>
                                                    {totalPiecesData.filteredData.length === 0 ? (
                                                        <div className="chart-empty-state">No data available for the selected filters</div>
                                                    ) : (
                                                        <div style={{ height: '300px', overflow: 'hidden' }}>
                                                            <ScrollableChart
                                                                chartType="bar"
                                                                chartData={{
                                                                    labels: totalPiecesData.filteredData.map(d => employeeMap[d.employee_id] || `Emp ${d.employee_id}`),
                                                                    datasets: [{
                                                                        label: "Total Pieces Completed",
                                                                        data: totalPiecesData.filteredData.map(d => d.total_completed),
                                                                        backgroundColor: barColors.backgroundColors,
                                                                        borderColor: barColors.borderColors,
                                                                        borderWidth: 2,
                                                                        borderRadius: 6,
                                                                        maxBarThickness: totalPiecesData.filteredData.length > 10 ? 25 : 45
                                                                    }]
                                                                }}
                                                                chartOptions={{
                                                                    ...chartOptions,
                                                                    scales: {
                                                                        ...chartOptions.scales,
                                                                        x: {
                                                                            ...chartOptions.scales.x,
                                                                            ticks: {
                                                                                ...chartOptions.scales.x.ticks,
                                                                                autoSkip: false,
                                                                                maxRotation: 45,
                                                                                minRotation: 45,
                                                                                font: {
                                                                                    ...chartOptions.scales.x.ticks.font,
                                                                                    size: 9 // Slightly smaller font for better fit
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }}
                                                                dataCount={totalPiecesData.filteredData.length}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-12 col-lg-8">
                                                <div className="card shadow-sm">
                                                    <h5 className="chart-title">Performance Comparison</h5>
                                                    {employeePerformanceData.radarData.length === 0 ? (
                                                        <div className="chart-empty-state">No data available for the selected filters</div>
                                                    ) : showRadar ? (
                                                        // Show radar for limited number of employees
                                                        <div style={{ height: '350px', overflow: 'hidden' }}>
                                                            <ScrollableChart
                                                                chartType="radar"
                                                                chartData={{
                                                                    labels: employeePerformanceData.radarData.map(d => employeeMap[d.employee_id] || `Emp ${d.employee_id}`),
                                                                    datasets: [{
                                                                        label: "Task Completion",
                                                                        data: employeePerformanceData.radarData.map(d => d.total_completed),
                                                                        backgroundColor: "rgba(94, 114, 228, 0.25)",
                                                                        borderColor: "rgba(94, 114, 228, 1)",
                                                                        pointBackgroundColor: "rgba(94, 114, 228, 1)",
                                                                        pointBorderColor: "#fff",
                                                                        pointHoverBackgroundColor: "#fff",
                                                                        pointHoverBorderColor: "rgba(94, 114, 228, 1)"
                                                                    }]
                                                                }}
                                                                chartOptions={radarOptions}
                                                                dataCount={employeePerformanceData.radarData.length}
                                                            />
                                                        </div>
                                                    ) : (
                                                        // Show horizontal bar for many employees
                                                        <div style={{ height: '350px', overflow: 'hidden' }}>
                                                            <ScrollableChart
                                                                chartType="bar"
                                                                chartData={{
                                                                    labels: employeePerformanceData.filteredData.map(d => employeeMap[d.employee_id] || `Emp ${d.employee_id}`),
                                                                    datasets: [{
                                                                        label: "Task Completion",
                                                                        data: employeePerformanceData.filteredData.map(d => d.total_completed),
                                                                        backgroundColor: barColors.backgroundColors,
                                                                        borderColor: barColors.borderColors,
                                                                        borderWidth: 2,
                                                                        borderRadius: 6
                                                                    }]
                                                                }}
                                                                chartOptions={{
                                                                    ...chartOptions,
                                                                    indexAxis: 'y', // Horizontal bar chart
                                                                    scales: {
                                                                        ...chartOptions.scales,
                                                                        y: {
                                                                            ...chartOptions.scales.y,
                                                                            ticks: {
                                                                                ...chartOptions.scales.y.ticks,
                                                                                autoSkip: false,
                                                                                callback: function(value, index, values) {
                                                                                    // Truncate long employee names if needed
                                                                                    const label = this.getLabelForValue(value);
                                                                                    if (label && label.length > 15) {
                                                                                        return label.substring(0, 15) + '...';
                                                                                    }
                                                                                    return label;
                                                                                },
                                                                                font: {
                                                                                    ...chartOptions.scales.y.ticks.font,
                                                                                    size: 9 // Smaller font for employee names
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }}
                                                                dataCount={employeePerformanceData.filteredData.length}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Card>
                        );
                    })}
                </Accordion>
            ) : (
                <div className="text-center text-danger">
                    <i className="fas fa-chart-line fa-3x mb-3"></i>
                    <p>No productivity data available for analysis.</p>
                </div>
            )}
        </div>
    );
};

export default EmployeeProductivityGraphs;
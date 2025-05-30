import { useState, useEffect, useContext } from "react";
import axios from "axios";
import AssignMachine from "./AssignMachine";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Orders.css";
import { FaEye, FaTrashAlt, FaCogs, FaCheckCircle, FaSpinner, FaBox, FaClipboardList, FaChevronDown, FaTimes } from "react-icons/fa";

// Create a custom hook to access the navbar collapsed state
const useNavbarState = () => {
  // Check if there's a navbar collapsed state in localStorage
  const storedState = localStorage.getItem("navbarCollapsed");
  return { isNavbarCollapsed: storedState === "true" };
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('live');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSteps, setOrderSteps] = useState([]);
  const [assignStep, setAssignStep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { isNavbarCollapsed } = useNavbarState(); // Get navbar collapsed state

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/orders/progress`)
      .then((response) => {
        console.log(" Orders Progress Fetched:", response.data);
        setOrders(response.data);
        setFilteredOrders(response.data); // Initialize filteredOrders
        setLoading(false);
      })
      .catch((error) => {
        console.error(" Error fetching orders:", error);
        setLoading(false);
      });
  };

  const fetchOrderSteps = async (orderId) => {
    setStepsLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/steps`);
      console.log(" Steps fetched for Order", orderId, ":", response.data);

      const stepsWithQuantity = response.data.map((step) => ({
        ...step,
        quantity: orders.find((order) => order.id === orderId)?.quantity || 0,
      }));

      setOrderSteps(stepsWithQuantity);
      setSelectedOrder(orders.find((o) => o.id === orderId));
    } catch (error) {
      console.error("Error fetching order steps:", error);
      alert("Failed to fetch order steps!");
    }
    setStepsLoading(false);
  };

  const deleteOrder = (id) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this order?")) return;
    axios
      .delete(`${process.env.REACT_APP_API_URL}/api/orders/${id}`)
      .then((response) => {
        console.log(response.data.message);
        setOrders(orders.filter((order) => order.id !== id));
        setFilteredOrders(filteredOrders.filter((order) => order.id !== id)); // Update filteredOrders
      })
      .catch((error) => {
        console.error("❌ Error deleting order:", error);
        alert("❌ Failed to delete order!");
      });
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bi-hourglass-split';
      case 'in progress':
        return 'bi-arrow-repeat';
      case 'completed':
        return 'bi-check-circle';
      case 'cancelled':
        return 'bi-x-circle';
      default:
        return 'bi-question-circle';
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'pending';
      case 'in progress':
        return 'in-progress';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return '';
    }
  };

  const calculateProgress = (step) => {
    if (!step.quantity) return 0;
    const percentage = Math.min(100, Math.round((step.completed / step.quantity) * 100));
    return percentage;
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const isMobileView = () => {
    return window.innerWidth <= 768;
  };

  // Filter orders based on the selected filter
  const filterOrders = (filter) => {
    setActiveFilter(filter);
    switch (filter) {
      case 'completed':
        setFilteredOrders(orders.filter(order => 
          order.current_stage.toLowerCase() === 'ready for dispatch'
        ));
        break;
      case 'live':
        setFilteredOrders(orders.filter(order => 
          order.current_stage.toLowerCase() !== 'ready for dispatch'
        ));
        break;
      default:
        setFilteredOrders(orders);
        break;
    }
  };

  // Update useEffect to set initial filtered orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Add new useEffect for filtering
  useEffect(() => {
    filterOrders('live');
  }, [orders]);

  // Responsive card view of an order for mobile
  const renderOrderCard = (order) => {
    const isExpanded = expandedOrder === order.id;
    
    return (
      <div className="order-card" key={order.id}>
        <div 
          className="order-card-header" 
          onClick={() => toggleOrderExpand(order.id)}
        >
          <div className="order-card-title">
            <span className="order-number">#{order.order_number}</span>
            <span className="order-product">{order.product}</span>
          </div>
          <div className="order-card-badges">
            <span className={`status-badge ${getStatusClass(order.current_stage)}`}>
              <i className={`bi ${getStatusIcon(order.current_stage)}`}></i>
              {order.current_stage}
            </span>
            <FaChevronDown className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
          </div>
        </div>
        
        <div className={`order-card-details ${isExpanded ? 'expanded' : ''}`}>
          <div className="order-detail-item">
            <span className="detail-label">Order ID:</span>
            <span className="detail-value">{order.id}</span>
          </div>
          <div className="order-detail-item">
            <span className="detail-label">Quantity:</span>
            <span className="detail-value">{order.quantity}</span>
          </div>
          <div className="order-detail-item">
            <span className="detail-label">Created Date:</span>
            <span className="detail-value">
              <i className="bi bi-calendar-event me-1"></i>
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="order-detail-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchOrderSteps(order.id);
              }}
              className="action-button view"
            >
              <FaEye /> View
            </button>
            <button
              className="action-button delete"
              onClick={(e) => {
                e.stopPropagation();
                deleteOrder(order.id);
              }}
            >
              <FaTrashAlt /> Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Responsive card view of a step for mobile
  const renderStepCard = (step, index) => {
    return (
      <div className="step-card" key={index}>
        <div className="step-card-header">
          <span className="step-name">{step.name}</span>
          <span className="step-completion">{step.completed}/{step.quantity}</span>
        </div>
        
        <div className="step-card-progress">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${calculateProgress(step)}%` }}
            ></div>
          </div>
          <span className="progress-percentage">{calculateProgress(step)}%</span>
        </div>
        
        <div className="step-card-actions">
          <button
            onClick={() => setAssignStep({ order_id: selectedOrder.id, step: step.name })}
            className={`action-button ${step.completed >= step.quantity ? 'view' : 'assign'}`}
            disabled={step.completed >= step.quantity}
          >
            {step.completed >= step.quantity ? (
              <>
                <FaCheckCircle /> Completed
              </>
            ) : (
              <>
                <FaCogs /> Assign
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const FilterButtons = () => (
    <div className="filter-buttons mb-4">
      <div className="btn-group" role="group" aria-label="Order filters">
        <button
          type="button"
          className={`btn ${activeFilter === 'live' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => filterOrders('live')}
        >
          <FaSpinner className="me-2" />
          Live Orders
        </button>
        <button
          type="button"
          className={`btn ${activeFilter === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => filterOrders('completed')}
        >
          <FaCheckCircle className="me-2" />
          Completed
        </button>
        <button
          type="button"
          className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => filterOrders('all')}
        >
          <FaClipboardList className="me-2" />
          All Orders
        </button>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <div className="orders-container">
        <h1 className="orders-title text-center">Order Management</h1>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary loading-spinner" role="status" />
            <p className="mt-3 text-muted">Loading orders...</p>
          </div>
        ) : (
          <>
            {/* Add Filter Buttons */}
            <FilterButtons />

            {filteredOrders.length === 0 ? (
              <div className="alert alert-info rounded-3 border-0 shadow-sm">
                <div className="d-flex align-items-center">
                  <FaClipboardList className="me-2" />
                  <span>No {activeFilter} orders found.</span>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile view - cards */}
                <div className="d-block d-md-none order-cards-container">
                  {filteredOrders.map(order => renderOrderCard(order))}
                </div>

                {/* Desktop view - table */}
                <div className="d-none d-md-block order-table-container">
                  <table className="order-table table table-hover">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Order Number</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="order-row">
                          <td>{order.id}</td>
                          <td>{order.order_number}</td>
                          <td>{order.product}</td>
                          <td>{order.quantity}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(order.current_stage)}`}>
                              <i className={`bi ${getStatusIcon(order.current_stage)}`}></i>
                              {order.current_stage}
                            </span>
                          </td>
                          <td>
                            <span className="created-date">
                              <i className="bi bi-calendar-event me-1"></i>
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>
                          <td className="d-flex gap-2">
                            <button
                              onClick={() => fetchOrderSteps(order.id)}
                              className="action-button view"
                            >
                              <FaEye /> View
                            </button>
                            <button
                              className="action-button delete"
                              onClick={() => deleteOrder(order.id)}
                            >
                              <FaTrashAlt /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {selectedOrder && (
              <div className="order-steps-container">
                <div className="steps-header">
                  <h3 className="steps-title">
                    <FaBox className="text-primary" />
                    Order Steps
                    <span className="steps-badge">#{selectedOrder.order_number}</span>
                  </h3>
                  <button
                    className="close-button"
                    onClick={() => setSelectedOrder(null)}
                  >
                    <FaTimes />
                  </button>
                </div>

                {stepsLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-3 text-muted">Loading steps...</p>
                  </div>
                ) : (
                  <>
                    {orderSteps.length === 0 ? (
                      <div className="alert alert-info">No steps found for this order.</div>
                    ) : (
                      <>
                        {/* Mobile view - step cards */}
                        <div className="d-block d-md-none steps-cards-container">
                          {orderSteps.map((step, index) => renderStepCard(step, index))}
                        </div>

                        {/* Desktop view - table */}
                        <div className="d-none d-md-block table-responsive-container">
                          <table className="order-table table table-hover">
                            <thead>
                              <tr>
                                <th>Step Name</th>
                                <th>Progress</th>
                                <th>Completed</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderSteps.map((step, index) => (
                                <tr key={index} className="order-row">
                                  <td>{step.name}</td>
                                  <td style={{ width: "30%" }}>
                                    <div className="d-flex align-items-center">
                                      <div className="progress-bar-container flex-grow-1">
                                        <div 
                                          className="progress-bar-fill" 
                                          style={{ width: `${calculateProgress(step)}%` }}
                                        ></div>
                                      </div>
                                      <span className="ms-2 small">
                                        {calculateProgress(step)}%
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    {step.completed} / {step.quantity}
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => setAssignStep({ order_id: selectedOrder.id, step: step.name })}
                                      className={`action-button ${step.completed >= step.quantity ? 'view' : 'assign'}`}
                                      disabled={step.completed >= step.quantity}
                                    >
                                      {step.completed >= step.quantity ? (
                                        <>
                                          <FaCheckCircle /> Completed
                                        </>
                                      ) : (
                                        <>
                                          <FaCogs /> Assign
                                        </>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Assign Machine Modal */}
            {assignStep && (
              <AssignMachine
                stepId={{ order_id: assignStep.order_id, step: assignStep.step }}
                onClose={() => setAssignStep(null)}
                isNavbarCollapsed={isNavbarCollapsed}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;

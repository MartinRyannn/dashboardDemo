import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ActiveOrdersTable = ({ activeOrders }) => {
  if (!activeOrders) {
    return (
      <div className="activeTrades-table">
        <div className="activeTrades-header">
          <div className="col direction">TYPE</div>
          <div className="col price">PRICE</div>
          <div className="col units">UNITS</div>
          <div className="col pl">ORDER PRICE</div>
          <div className="col margin">CREATED</div>
        </div>
        <div className="activeTrades-body">
          <div className="noEvent">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="activeTrades-table">
      <div className="activeTrades-header">
        <div className="col direction">TYPE</div>
        <div className="col price">PRICE</div>
        <div className="col units">UNITS</div>
        <div className="col pl">ORDER PRICE</div>
        <div className="col margin">CREATED</div>
      </div>
      <div className="activeTrades-body">
        <AnimatePresence>
          {activeOrders.map((order, index) => (
            <motion.div
              className="activeTrades-row"
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className={`col direction ${order.units > 0 ? 'long' : 'short'}`}>
                {order.type}
              </div>
              <div className="col price">{order.price || "0.00"}</div>
              <div className="col units">{Math.abs(order.units) || "0"}</div>
              <div className="col pl">{order.price || "0.00"}</div>
              <div className="col margin">
                {order.createdTime ? new Date(order.createdTime).toLocaleTimeString() : "-"}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {activeOrders.length === 0 && (
          <div className="noEvent">No active orders available.</div>
        )}
      </div>
    </div>
  );
};

export default ActiveOrdersTable; 
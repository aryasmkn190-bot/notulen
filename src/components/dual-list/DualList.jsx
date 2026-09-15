// DualListBox.jsx
import React, { useState, useMemo } from 'react';

const DualListBox = ({
  options = [],
  selected = [],
  onChange = () => {},
  leftHeader = 'Available',
  rightHeader = 'Selected',
  showSearch = true,
  placeholderLeft = 'Search available',
  placeholderRight = 'Search selected',
  className = '',
  iconButton = false,
}) => {
  const [leftFilter, setLeftFilter] = useState('');
  const [rightFilter, setRightFilter] = useState('');
  const [leftSelected, setLeftSelected] = useState(new Set());
  const [rightSelected, setRightSelected] = useState(new Set());

  // Split options into left and right
  const leftOptions = useMemo(() => {
    const selectedSet = new Set(selected);
    return options.filter(opt => !selectedSet.has(opt.value));
  }, [options, selected]);

  const rightOptions = useMemo(() => {
    const selectedSet = new Set(selected);
    return options.filter(opt => selectedSet.has(opt.value));
  }, [options, selected]);

  // Filtered versions
  const filteredLeft = useMemo(() => {
    if (!leftFilter) return leftOptions;
    const term = leftFilter.toLowerCase();
    return leftOptions.filter(opt => opt.label.toLowerCase().includes(term));
  }, [leftOptions, leftFilter]);

  const filteredRight = useMemo(() => {
    if (!rightFilter) return rightOptions;
    const term = rightFilter.toLowerCase();
    return rightOptions.filter(opt => opt.label.toLowerCase().includes(term));
  }, [rightOptions, rightFilter]);

  const moveToRight = () => {
    if (leftSelected.size === 0) return;
    const newSelected = [...selected, ...Array.from(leftSelected)];
    onChange(newSelected);
    setLeftSelected(new Set());
  };

  const moveToLeft = () => {
    if (rightSelected.size === 0) return;
    const toRemove = new Set(rightSelected);
    const newSelected = selected.filter(v => !toRemove.has(v));
    onChange(newSelected);
    setRightSelected(new Set());
  };

  const moveAllToRight = () => {
    const newSelected = options.map(opt => opt.value);
    onChange(newSelected);
    setLeftSelected(new Set());
  };

  const moveAllToLeft = () => {
    onChange([]);
    setRightSelected(new Set());
  };

  const handleDoubleClickLeft = (value) => {
    const newSet = new Set(leftSelected);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setLeftSelected(newSet);
    moveToRight(); // auto move on double-click
  };

  const handleDoubleClickRight = (value) => {
    const newSet = new Set(rightSelected);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setRightSelected(newSet);
    moveToLeft();
  };

  return (
    <div className={`dual-listbox ${className}`}>
      <div className="dual-listbox-column">
        {showSearch && (
          <input
            type="text"
            value={leftFilter}
            onChange={e => setLeftFilter(e.target.value)}
            placeholder={placeholderLeft}
            className="dual-listbox-search"
          />
        )}
        <div className="dual-listbox-title">{leftHeader}</div>
        <ul className="dual-listbox-list dual-listbox-available">
          {filteredLeft.map(opt => (
            <li
              key={opt.value}
              className={`dual-listbox-item ${
                leftSelected.has(opt.value) ? 'selected' : ''
              } ${opt.disabled ? 'disabled' : ''}`}
              onClick={() => {
                if (opt.disabled) return;
                const newSet = new Set(leftSelected);
                if (newSet.has(opt.value)) {
                  newSet.delete(opt.value);
                } else {
                  newSet.add(opt.value);
                }
                setLeftSelected(newSet);
              }}
              onDoubleClick={() => !opt.disabled && handleDoubleClickLeft(opt.value)}
            >
              {opt.label}
            </li>
          ))}
          {filteredLeft.length === 0 && <li className="dual-listbox-empty">No items</li>}
        </ul>
      </div>

      <div className="dual-listbox-buttons">
        <button className="dual-listbox-button" onClick={moveAllToRight}>
            {iconButton ? <em className="icon ni ni-chevrons-right"></em> : 'Add All'}
        </button>
        <button className="dual-listbox-button" onClick={moveToRight} disabled={leftSelected.size === 0} >
            {iconButton ? <em className="icon ni ni-chevron-right"></em> : 'Add'}
        </button>
        <button className="dual-listbox-button" onClick={moveToLeft} disabled={rightSelected.size === 0} >
            {iconButton ? <em className="icon ni ni-chevron-left"></em> : 'Remove'}
        </button>
        <button className="dual-listbox-button" onClick={moveAllToLeft} >
            {iconButton ? <em className="icon ni ni-chevrons-left"></em> : 'Remove All'}
        </button>
      </div>

      <div className="dual-listbox-column">
        {showSearch && (
          <input
            type="text"
            value={rightFilter}
            onChange={e => setRightFilter(e.target.value)}
            placeholder={placeholderRight}
            className="dual-listbox-search"
          />
        )}
        <div className="dual-listbox-title">{rightHeader}</div>
        <ul className="dual-listbox-list dual-listbox-selected">
          {filteredRight.map(opt => (
            <li
              key={opt.value}
              className={`dual-listbox-item ${
                rightSelected.has(opt.value) ? 'selected' : ''
              } ${opt.disabled ? 'disabled' : ''}`}
              onClick={() => {
                if (opt.disabled) return;
                const newSet = new Set(rightSelected);
                if (newSet.has(opt.value)) {
                  newSet.delete(opt.value);
                } else {
                  newSet.add(opt.value);
                }
                setRightSelected(newSet);
              }}
              onDoubleClick={() => !opt.disabled && handleDoubleClickRight(opt.value)}
            >
              {opt.label}
            </li>
          ))}
          {filteredRight.length === 0 && <li className="dual-listbox-empty">No items</li>}
        </ul>
      </div>
    </div>
  );
};

export default DualListBox;
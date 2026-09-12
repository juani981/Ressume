
import { ListPlus } from 'lucide-react'
import React from 'react';
    
const AddBulletPoint = (helperText,handleAddBullet) => {

    return (
        <>
    <div
        className="bullet-add-row no-print"
        style={{
            paddingLeft: '1.15rem',
            height: 0,
            lineHeight: 0,
            overflow: 'visible',
            position: 'relative'
        }}
    >
        <button
            type="button"
            className="add-bullet-btn no-print"
            onClick={handleAddBullet}
            title={helperText}
        >
            <ListPlus size={14}/>
            <span>Agregar nueva viñeta</span>
        </button>
            </div>
            </>
    )
};

export default AddBulletPoint;
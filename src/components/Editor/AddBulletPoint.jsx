
import { ListPlus } from 'lucide-react'
import React from 'react';
    
const AddBulletPoint = (helperText,handleAddBullet) => {

    return (
        <>
    <div
        className="bullet-add-row no-print"
        data-editor-ui="true"
        data-editor-add="true"
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
            data-editor-ui="true"
            data-editor-add="true"
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
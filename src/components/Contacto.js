import React from "react";
import "../styles/Contacto.css"

const Contact = () => {
    return (
        <section className="contact-section">
            <h1 className="contact-title">¡Únete ahora!</h1>
            <form className="contact-form">
                <div className="form-row">
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Nombre"
                        required
                    />
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Apellidos"
                        required
                    />
                </div>
                <input 
                    type="email" 
                    className="form-input form-input-full" 
                    placeholder="Correo electrónico"
                    required
                />
                <textarea 
                    className="form-textarea" 
                    placeholder="Mensaje"
                    rows="6"
                    required
                ></textarea>
                <button type="submit" className="form-button">
                    Enviar solicitud
                </button>
            </form>
        </section>
    );
};

export default Contact
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Loader = () => {
  return (
    <StyledWrapper>
      <motion.div
        className="center"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 5, y: -50 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="loader"
          animate={{ y: [0, -6, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
          transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
        >
          <span />
        </motion.div>

        <motion.h2
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 5, ease: "linear", repeat: Infinity }}
        >
          Anubis
        </motion.h2>

      </motion.div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width:100vw;
  height:100vh;
  background:#070708;
  display:flex;
  align-items:center;
  justify-content:center;

  .center{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:18px;
  }

h2{
  font-size:50px;
  font-weight:700;
  background: linear-gradient(90deg, #00E1FF, #7B88FF, #FD8899);
  
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  letter-spacing:1.5px;
}

  .loader {
    position: relative;
    width: 170px;
    height: 170px;
    background: transparent;
    border-radius: 50%;
    box-shadow: 25px 25px 75px rgba(0, 0, 0, 0.55);
    border: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .loader::before {
    content: '';
    position: absolute;
    background: transparent;
    border: 1px dashed #444;
    border-radius: 50%;
    inset: 24px;
    box-shadow: inset -5px -5px 25px rgba(0, 0, 0, 0.25),
                inset 5px 5px 35px rgba(0, 0, 0, 0.25);
  }

  .loader::after {
    content: '';
    position: absolute;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 1px dashed #444;
    box-shadow: inset -5px -5px 25px rgba(0, 0, 0, 0.25),
                inset 5px 5px 35px rgba(0, 0, 0, 0.25);
  }

  .loader span {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50%;
    height: 100%;
    background: transparent;
    transform-origin: top left;
    animation: radar81 2s linear infinite;
    border-top: 1px dashed #fff;
  }

  .loader span::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #0098b091;
    filter: blur(30px) drop-shadow(20px 20px 20px #0098b091);
    transform-origin: top left;
    transform: rotate(-55deg);
  }

  @keyframes radar81 {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default Loader;

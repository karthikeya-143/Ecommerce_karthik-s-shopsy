import React from 'react'
import './DescriptionBox.css'
const DescriptionBox = () => {
  return (
    <div className='descriptionbox'>
        <div className="descriptionbox-navigator">
            <div className="descriptionbox-nav-box">Description</div>
            <div className="descriptionbox-nav-box fade">Reviews (122)</div>
        </div>
        <div className="descriptionbox-description">
            <p>An e-commerce website is an online platform that facilitate buying and selling of 
                products or services over the internet serves as a virtual marketplace where business and individual
                showcase their products, interact with customers, and conduct transactions without the need for a physical presence. E-commerce
                Websites have gained immense popularity due to their conveniction accessibility, and the global reach they offer.
            </p>
            <p>
                E-commerce website typically display products or services along with detailed description,images,prices
                and any available variations (e.g., sizes,colors).Each product usually has its own dedicated page with relevant
                information
            </p>
        </div>
    </div>
  )
}

export default DescriptionBox
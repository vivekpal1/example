'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Slider from "react-slick";
import useSound from 'use-sound';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEthers } from '@usedapp/core';
import { wormholeIntegration } from '@/integrations/wormhole-integration';
import { ethers } from 'ethers';

const skins = [
  { id: 1, name: "Dragon's Breath", price: 0.5, image: "/rifle-skin-1.jpg" },
  { id: 2, name: "Neon Fury", price: 0.4, image: "/rifle-skin-2.jpg" },
  { id: 3, name: "Arctic Frost", price: 0.6, image: "/rifle-skin-3.jpg" },
  { id: 4, name: "Crimson Elite", price: 0.55, image: "/rifle-skin-4.jpg" },
  { id: 5, name: "Shadow Ops", price: 0.45, image: "/rifle-skin-5.jpg" },
  { id: 6, name: "Golden Phoenix", price: 0.7, image: "/rifle-skin-6.jpg" },
  { id: 7, name: "Cyber Punk", price: 0.5, image: "/rifle-skin-7.jpg" },
  { id: 8, name: "Spectrum", price: 0.65, image: "/rifle-skin-8.jpg" },
];

const Skins: React.FC = () => {
  const [playScrollSound] = useSound('/click-sound.mp3');
  const [playClickSound] = useSound('/click-sound.mp3');
  const sliderRef = useRef<Slider | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const { publicKey: solanaPublicKey } = useWallet();
  const { account: ethereumAccount, activateBrowserWallet } = useEthers();

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (sliderRef.current) {
        if (e.deltaY > 0) {
          sliderRef.current.slickNext();
          playScrollSound();
        } else if (e.deltaY < 0) {
          sliderRef.current.slickPrev();
          playScrollSound();
        }
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [playScrollSound]);

  const handlePurchase = async (skin: typeof skins[0]) => {
    if (!solanaPublicKey || !ethereumAccount) {
      alert("Please connect both Solana and Ethereum wallets");
      return;
    }

    setPurchaseStatus('processing');
    playClickSound();

    const skinPriceInUSDC = BigInt(Math.floor(skin.price * 1e6));
    
    try {
      await activateBrowserWallet();

      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();

      const success = await wormholeIntegration.purchaseSkinWithCrossChainPayment(
        skinPriceInUSDC,
        ethereumAccount,
        solanaPublicKey.toString(),
        signer,
        process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS || ''
      );

      if (success) {
        setPurchaseStatus('success');
        console.log(`Skin ${skin.name} purchased successfully!`);
      } else {
        setPurchaseStatus('error');
      }
    } catch (error) {
      console.error("Error purchasing skin:", error);
      setPurchaseStatus('error');
    }
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '0',
    beforeChange: () => playScrollSound(),
    swipe: true,
    swipeToSlide: true,
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      <Slider ref={sliderRef} {...settings} className="skins-slider h-full">
        {skins.map((skin) => (
          <motion.div
            key={skin.id}
            className="px-4 h-full flex items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="bg-purple-900 bg-opacity-30 backdrop-blur-md border border-purple-500 shadow-lg overflow-hidden h-[60vh] w-[380px] mx-auto flex flex-col"
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <motion.div 
                className="relative flex-grow flex items-center justify-center p-4"
                whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
              >
                <Image 
                  src={skin.image} 
                  alt={skin.name} 
                  width={220}
                  height={220}
                  objectFit="contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-transparent to-transparent opacity-70"></div>
              </motion.div>
              <div className="p-4 relative z-10">
                <motion.h3 
                  className="text-xl font-bold mb-2 text-purple-300"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {skin.name}
                </motion.h3>
                <motion.p 
                  className="text-lg text-purple-400 mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {skin.price} SOL
                </motion.p>
                <Dialog>
                  <DialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white text-base py-2"
                        onClick={playClickSound}
                        disabled={purchaseStatus === 'processing' || !solanaPublicKey || !ethereumAccount}
                      >
                        {purchaseStatus === 'processing' ? 'Processing...' : 'Purchase'}
                      </Button>
                    </motion.div>
                  </DialogTrigger>
                  <DialogContent className="bg-violet-900 bg-opacity-30 backdrop-blur-lg border border-violet-500 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-2xl text-purple-300">Purchase {skin.name}</DialogTitle>
                      <DialogDescription className="text-purple-400 text-lg">
                        You are about to purchase {skin.name} for {skin.price} SOL using USDC from Ethereum.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-between mt-6">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          className="bg-violet-600 hover:bg-violet-700 text-white text-lg py-3 px-6"
                          onClick={() => handlePurchase(skin)}
                          disabled={purchaseStatus === 'processing'}
                        >
                          {purchaseStatus === 'processing' ? 'Processing...' : 'Confirm Purchase'}
                        </Button>
                      </motion.div>
                    </div>
                    {purchaseStatus === 'success' && (
                      <p className="text-green-400 mt-4">Purchase successful! The skin will be added to your inventory.</p>
                    )}
                    {purchaseStatus === 'error' && (
                      <p className="text-red-400 mt-4">An error occurred during the purchase. Please try again.</p>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </Slider>
    </div>
  );
};

export default Skins;
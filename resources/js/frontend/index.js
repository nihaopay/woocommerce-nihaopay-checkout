import { sprintf, __ } from "@wordpress/i18n";
import { registerPaymentMethod } from "@woocommerce/blocks-registry";
import { decodeEntities } from "@wordpress/html-entities";
import { getSetting } from "@woocommerce/settings";
import { useState, useEffect } from "@wordpress/element";
import alipayLogo from "../../images/alipay_logo.png";
import unionpayLogo from "../../images/unionpay_logo.png";
import wechatpayLogo from "../../images/wechatpay_logo.png";
import "./blocks.css";

const settings = getSetting("nihaopay_data", {});

const defaultLabel = __("NihaoPay Checkout", "woo-gutenberg-products-block");

const label = decodeEntities(settings.title) || defaultLabel;

const isWechatPayEnabled = decodeEntities(settings.enable_wechatpay) === "yes";
const isAlipayEnabled = decodeEntities(settings.enable_alipay) === "yes";
const isUnionPayEnabled = decodeEntities(settings.enable_unionpay) === "yes";

const VENDORS = {
  wechatpay: { name: "WeChat Pay", logo: wechatpayLogo },
  alipay: { name: "Alipay", logo: alipayLogo },
  unionpay: { name: "UnionPay", logo: unionpayLogo },
};

/**
 * Content component
 */
const Content = ({ eventRegistration, emitResponse }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const { onPaymentProcessing } = eventRegistration;

  const vendorMap = {
    wechatpay: isWechatPayEnabled,
    alipay: isAlipayEnabled,
    unionpay: isUnionPayEnabled,
  };

  useEffect(() => {
    const unsubscribe = onPaymentProcessing(async () => {
      const vendor = selectedOption?.toLowerCase() || "";

      if (!vendor || !vendorMap[vendor])
        return {
          type: emitResponse.responseTypes.ERROR,
          message: `Please select a payment method`,
        };

      return {
        type: emitResponse.responseTypes.SUCCESS,
        meta: {
          paymentMethodData: {
            vendor,
          },
        },
      };
    });

    return () => unsubscribe();
  }, [
    emitResponse.responseTypes.ERROR,
    emitResponse.responseTypes.SUCCESS,
    onPaymentProcessing,
    selectedOption,
  ]);

  // set default option
  useEffect(() => {
    if (isWechatPayEnabled) setSelectedOption("wechatpay");
    else if (isAlipayEnabled) setSelectedOption("alipay");
    else setSelectedOption("unionpay");
  }, [
    setSelectedOption,
    isWechatPayEnabled,
    isAlipayEnabled,
    isUnionPayEnabled,
  ]);

  const genVendorRadioButtonGroup = (key) => {
    const { name, logo } = VENDORS[key];
    const isSelected = selectedOption === key;
    return (
      <label className={`np-option${isSelected ? " is-selected" : ""}`}>
        <span className="np-vendor">
          <img className="np-logo" src={logo} alt="" />
          <span className="np-name">{name}</span>
        </span>
        <input
          name="vendor"
          type="radio"
          value={key}
          checked={isSelected}
          onChange={() => setSelectedOption(key)}
        />
      </label>
    );
  };

  return (
    <div className="nihaopay-fields">
      <fieldset>
        <legend>Select payment method</legend>
        {isUnionPayEnabled && genVendorRadioButtonGroup("unionpay")}
        {isWechatPayEnabled && genVendorRadioButtonGroup("wechatpay")}
        {isAlipayEnabled && genVendorRadioButtonGroup("alipay")}
      </fieldset>
    </div>
  );
};

/**
 * Label component
 *
 * @param {*} props Props from payment API.
 */
const Label = (props) => {
  const logoMap = {
    wechatpay: wechatpayLogo,
    alipay: alipayLogo,
    unionpay: unionpayLogo,
  };

  const genVendorIconContainer = (vendor) => {
    return (
      <div
        style={{
          height: "24px",
          maxHeight: "24px",
          width: "fit-content",
        }}
      >
        <img
          style={{
            height: "100%",
            objectFit: "cover",
          }}
          src={logoMap[vendor.toLowerCase()]}
          alt={`${vendor} logo`}
        />
      </div>
    );
  };

  const { PaymentMethodLabel } = props.components;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <PaymentMethodLabel text={label} />
      <div style={{ display: "flex", gap: "5px" }}>
        {["WechatPay", "AliPay", "UnionPay"].map((vendor) =>
          genVendorIconContainer(vendor),
        )}
      </div>
    </div>
  );
};

/**
 * NihaoPay Checkout Config Object
 */
const NihaoPay = {
  name: "nihaopay",
  label: <Label />,
  content: <Content />,
  edit: <Content />,
  canMakePayment: () => true,
  ariaLabel: label,
  supports: {
    features: settings.supports,
  },
};

registerPaymentMethod(NihaoPay);
